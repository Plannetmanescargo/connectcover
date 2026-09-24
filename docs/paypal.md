# PayPal checkout for Coverza

This adds direct-merchant PayPal Orders v2 checkout to the existing Coverza purchase journey. PayPal buttons (including eligible card funding), Apple Pay and Google Pay use one server-priced GBP order. Documents, email content, public document delivery and newsletter behaviour remain unchanged. Wallet availability depends on account enablement and device eligibility. This is not a guarantee of standalone card fields or guest-card eligibility.

## Account setup

1. Sign into https://developer.paypal.com/dashboard/applications using the receiving PayPal Business account.
2. Start with **Sandbox**, create a REST app, and copy its **Client ID** and **Secret**. Get the **Merchant ID** for the same sandbox business account. For production, repeat under **Live**, using the live receiving account's Merchant ID (Business account settings / Business information).
3. In the app features, enable PayPal checkout, Apple Pay and Google Pay as available. Complete PayPal's production onboarding for Advanced/Expanded Checkout and the wallets if requested. A Business account alone does not guarantee live wallet eligibility.
4. Add a webhook to this SAME app and environment:
   `https://www.coverza.uk/api/paypal/webhook`
   Use your actual public HTTPS test origin when testing. Copy the resulting **Webhook ID**; this is not an API key or event ID.
5. Select these events (API identifiers shown):

   - `CHECKOUT.ORDER.APPROVED`
   - `CHECKOUT.PAYMENT-APPROVAL.REVERSED`
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.PENDING`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`
   - `PAYMENT.CAPTURE.REVERSED`
   - `CUSTOMER.DISPUTE.CREATED`

Webhook signatures are verified through PayPal using the configured Webhook ID. A real sandbox transaction is needed for end-to-end testing; simulator messages do not establish a real paid order. Approval triggers capture; only a matching completed capture triggers fulfilment. Refunds/reversals/disputes flag a checkout for manual review and block further fulfilment; they do not automatically cancel cover or issue refunds.

## Environment variables

Set these in your hosting environment. Never commit credentials or put the secret in a `NEXT_PUBLIC_` variable.

```dotenv
PAYMENT_PROVIDER=paypal
PAYPAL_ENABLED=true
PAYPAL_ENVIRONMENT=sandbox
PAYPAL_CLIENT_ID=your_app_client_id
PAYPAL_CLIENT_SECRET=your_app_secret
PAYPAL_MERCHANT_ID=the_receiving_business_account_merchant_id
PAYPAL_WEBHOOK_ID=the_webhook_id_from_that_same_app
PAYPAL_APPLE_PAY_ENABLED=true
PAYPAL_GOOGLE_PAY_ENABLED=true
NEXT_PUBLIC_BASE_URL=https://www.coverza.uk
# Keep the existing strong CRON_SECRET and fulfilment/database/email settings.
```

Use `PAYPAL_ENVIRONMENT=live` with all four matching live values for production. Only the Client ID is deliberately passed to the browser. The default environment is sandbox; the default processor remains Mollie until `PAYMENT_PROVIDER=paypal` is set. `PAYPAL_ENABLED` gates new PayPal purchases, not reconciliation of existing ones. There is no silent failover to another processor.

## Apple Pay

The app serves the correct PayPal association file at:
`https://www.coverza.uk/.well-known/apple-developer-merchantid-domain-association`

With `PAYPAL_APPLE_PAY_ENABLED=true`, `PAYPAL_ENVIRONMENT` chooses the bundled PayPal sandbox/live file. With it disabled, the existing legacy association file remains available. The verification endpoint returns HTTP 200 and `application/octet-stream`, without a domain redirect. Files came from PayPal's official documentation on 2026-09-24; refresh them from the documented URLs if PayPal changes them.

Deploy first. In the PayPal app, go to **Features → Apple Pay → Manage → Add Domain**, register `www.coverza.uk`, and verify it. Register any other hostname that actually displays the payment button separately, in the appropriate environment. Sandbox registration does not register the live domain. Check that your hosting firewall allows Apple to retrieve the file without authentication or redirects. Test with a compatible Apple device and the correct sandbox/live wallet account.

## Google Pay

Enable Google Pay for the same PayPal app and complete PayPal's Google Pay production onboarding. The integration uses merchant configuration from `paypal.Googlepay().config()`; no separate Google secret/API key is used by this code. Complete any additional setup requested by the account onboarding flow. The browser uses `TEST` in sandbox and `PRODUCTION` in live mode, checks device eligibility, and handles `PAYER_ACTION_REQUIRED` with PayPal's 3DS flow. An explicit unsuccessful liability shift blocks server capture.

## Deployment and switching

1. Configure matching sandbox credentials on a separate HTTPS test deployment/database. Sandbox purchases run the existing real document/email pipeline: use test customer addresses and isolated data.
2. Apply the included additive migration before serving the new application:
   `npx prisma migrate deploy`
3. Build/deploy the branch using your normal workflow. Migration adds PAYPAL and nullable checkout recovery fields; it does not rewrite historical payments.
4. Ensure the authenticated recovery job runs every minute. `vercel.json` includes `/api/cron/paypal`; Vercel sends the configured `CRON_SECRET` as a bearer token. For a VPS, schedule an HTTPS GET with `Authorization: Bearer <CRON_SECRET>`. Keep the Mollie/Worldpay jobs for outstanding purchases.
5. Register wallets and perform the tests below. Then set matching live credentials/mode and `PAYMENT_PROVIDER=paypal`, and redeploy/restart. A successful live purchase must be checked before treating this as ready for customer traffic.
6. When Mollie is approved, set `PAYMENT_PROVIDER=mollie`, retain `MOLLIE_ENABLED=true` and the existing Mollie configuration, then redeploy/restart. Keep the PayPal credentials, webhook and cron enabled so in-flight PayPal purchases finish. Do not rotate/remove the PayPal app while it has unresolved checkouts.

No live credentials were available during implementation. Account approvals, real wallet transactions, production migrations and deployment must be completed separately.

## Acceptance tests

- PayPal sandbox approval → one capture → one policy → stored documents → one initial email.
- Cancel the PayPal window, then retry; no cover before payment.
- Apple Pay on a verified sandbox domain and supported device.
- Google Pay success and a 3DS challenge; declined authentication must not fulfil.
- Pending and declined capture responses show waiting/failure, never confirmed cover.
- Close the tab immediately after approval; webhook/cron must finish the purchase.
- Replay a completed webhook; no duplicate policy or initial email.
- Temporarily fail document/email delivery; restore it and run cron to recover.
- Refund/reversal/dispute → manual-review flag. Replaying older approval/completed events must not clear that flag.
- Switch new purchases to Mollie while an approved PayPal purchase is outstanding; PayPal must still complete.
- Register the live Apple Pay domain, make a permitted live purchase using a separate buyer, verify the capture in PayPal and all downstream outputs.

## Recovery and implementation notes

- Price and customer/vehicle data are validated server-side by the existing shared checkout validator.
- The browser UUID, request hash, PayPal order ID, merchant identity and capture ID are persisted. Both create and capture use stable PayPal request IDs.
- Retries stop before PayPal's default six-hour idempotency retention expires. Ambiguous older captures require manual review rather than another charge.
- A database lease serializes webhook/status/cron processing. Failed work remains due for the cron worker.
- Capture status, amount, currency, payee, order reference and capture identity are verified using the authenticated Orders API. Browser redirects and posted webhook status never directly confirm cover.
- Status endpoints expose no customer details. The checkout URL is an unguessable bearer link and the payment page suppresses referrers.
- A refund/dispute flag remains sticky until an operator reconciles the payment. Resolve in PayPal and the existing policy administration process before manually requeueing anything.
- Monitor `paypalReviewReason`, overdue `paypalNextAttemptAt`, and sanitized `[paypal]` retry logs. Existing email retry retention still applies.

## References

- https://developer.paypal.com/docs/api/orders/v2/
- https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature_post
- https://developer.paypal.com/api/rest/webhooks/event-names/
- https://developer.paypal.com/v5/apple-pay/integrate
- https://developer.paypal.com/v5/google-pay/integrate
- Live association file: https://www.paypalobjects.com/devdoc/apple-pay/well-known/apple-developer-merchantid-domain-association
- Sandbox association file: https://www.paypalobjects.com/devdoc/apple-pay/sandbox/apple-developer-merchantid-domain-association
