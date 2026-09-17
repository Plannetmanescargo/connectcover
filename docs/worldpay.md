# Worldpay Hosted Payment Pages

This integration uses Access Worldpay HPP v1, matching the supplied documentation. It does not use Worldpay Online Payments XML or the older Business Gateway installation ID API.

## Routes and retained fallback

- `POST /api/worldpay/checkout` creates a hosted checkout.
- `POST /api/worldpay/webhook` verifies `Event-Signature` before processing events.
- The quote page now opens the Worldpay checkout.
- `/checkout/success?provider=worldpay&checkout_id=...` reads the database. A browser redirect never marks a payment paid.
- `/checkout/worldpay` handles failed, cancelled, expired and error returns without claiming that no charge occurred.
- Both files under `app/api/stripe` remain unchanged. They currently implement **Square**, despite their path names. Retaining them is not an automatic working Stripe fallback.

## Vercel environment variables

Configure these server-side secrets in the environment receiving the corresponding Worldpay events. Do not paste credentials into GitHub, source files or chat.

| Variable | Value |
| --- | --- |
| `WORLDPAY_ENVIRONMENT` | `try` for sandbox; `live` for production. Explicitly required. |
| `WORLDPAY_API_USERNAME` | API Basic Auth username from Worldpay Developer Tools. |
| `WORLDPAY_API_PASSWORD` | Corresponding API password, unencoded. |
| `WORLDPAY_ENTITY` | Exact merchant entity supplied by Worldpay. |
| `WORLDPAY_NARRATIVE` | Approved customer statement descriptor, 1–24 characters. |
| `WORLDPAY_WEBHOOK_KEY_ID` | Numeric key ID for the configured Worldpay HMAC shared secret. |
| `WORLDPAY_WEBHOOK_SECRET` | Worldpay's webhook HMAC shared secret, distinct from the API password. |
| `NEXT_PUBLIC_BASE_URL` | Canonical HTTPS website origin, e.g. `https://www.coverza.uk`. No path or query. |

Existing Prisma, Supabase, Resend and internal PDF-rendering variables remain required. Leave the existing Square/Stripe variables available for the retained routes.

## Webhook registration

For the current canonical hostname in the repository, register:

`https://www.coverza.uk/api/worldpay/webhook`

If deploying on a different hostname, substitute that site's canonical origin. The endpoint must be publicly reachable over HTTPS without login, a deployment protection page or a redirect.

1. In Worldpay eCommerce, enable events in the dashboard; Enterprise customers register through their Implementation Manager.
2. Enable HMAC `Event-Signature` delivery and obtain the shared secret **and key ID**. Contact Worldpay if these options are not available in the dashboard. The application deliberately refuses unsigned events.
3. Enable `sentForSettlement` (required for immediate policy issuance), and `settled` where available as a recovery event. Also enable `refused`, `cancelled`, `expired`, `error`, `settlementFailed`, `sentForRefund`, `refunded`, and `refundFailed` where offered. `authorized`/`sentForAuthorization` are acknowledged but do not issue policies.
4. Set the signing variables and redeploy. The checkout route requires signing configuration before it accepts purchases.
5. Confirm a sandbox event reaches this exact endpoint and passes signature verification. Do not guess the signing key ID.

`sentForSettlement` means capture/settlement has been requested, not that funds have finally settled. The application requests auto settlement and issues at this stage to support immediate cover. Later settlement failures and refunds are logged for manual review; they do not automatically cancel insurance policies. Monitor `[worldpay webhook] payment needs review` logs.

## Database and rollout order

1. Use a separate test database and test email recipient while `WORLDPAY_ENVIRONMENT=try`; sandbox payments exercise the real PDF/email fulfilment code. Do not run sandbox purchases against the production policy database.
2. Apply the additive migration to the intended database before deploying the new application:
   ```sh
   npm ci
   npx prisma migrate deploy
   npx prisma generate
   ```
   `DATABASE_URL` and `DIRECT_URL` must refer to the intended database. The migration adds `WORLDPAY` and nullable columns; it does not delete or rewrite existing records. The normal build generates the client but does **not** apply migrations.
3. Set all environment variables, register the webhook and deploy the branch to the test environment. Keep preview protection from blocking webhooks.
4. Complete a Worldpay test checkout. Check the amount, return URL, signed webhook, one policy, PDF storage and email delivery. Replay the event and confirm it does not create another policy or email.
5. Validate refused/cancelled payment returns and the awaiting-confirmation page. They must not show active cover.
6. After sandbox verification, configure matching live credentials, live entity and live signing details against the production database. Apply the production migration, merge/deploy, then run an authorized low-value live purchase and check the complete flow before opening checkout generally.

The source change alone does not register the webhook, set Vercel secrets, apply a database migration or activate the merchant account. These require the account configuration above.

## Payment integrity and retries

- The server recomputes the amount from the quote page's shared rate card and verifies the selected period. Client-supplied totals cannot reduce the price.
- Each stored checkout has its own opaque, environment-prefixed transaction reference and stores the Worldpay entity. The reference is also the stable policy idempotency key.
- Signed settlement events must match the stored reference, exact GBP amount, provider and environment; merchant and payment IDs are checked when supplied.
- Legacy HPP event shapes without merchant/payment IDs are accepted only with a valid signature and matching reference/amount/currency.
- `Event-Signature` uses `keyId/SHA256/signature`; multiple header entries are selected by configured key ID. Hex and canonical padded base64 digest encodings are accepted.
- A 90-second database lease serializes duplicate deliveries. The route runtime budget is 60 seconds. Failed fulfilment releases the lease; a killed worker's lease expires for a later retry.
- Policy creation, PDFs and email are awaited before acknowledging successful processing. Worldpay may retry after 10 seconds; an overlapping request fails for retry while the worker holds the lease. Once fulfilment succeeds, later events are acknowledged without running it again. No untracked background promise is used.
- Monitor non-200 webhook responses and reconcile paid Worldpay transactions that remain unfulfilled. Worldpay retries for a limited period (documented as up to one week); replay through Worldpay after correcting configuration or downstream failures. Long-running fulfilment must complete within the route's runtime budget.
- Do not rotate API environments in place while their events are still pending. Use separate sandbox/live deployments and matching signing credentials.
- Worldpay coupons are not implemented; Square dashboard coupons do not transfer to this integration.

For rollback, restore the quote page's checkout URL to `/api/stripe/checkout` only after confirming Square is operational. Keep `/api/worldpay/webhook` available to finish already-started Worldpay payments. The additive migration can remain installed.

## Verification

```sh
node --test tests/*.test.mjs
npx tsc --noEmit --incremental false
```

Tests mock external services; they do not charge cards or substitute for the sandbox/live acceptance test and actual migration.

## Provider references

- [Hosted payment setup](https://docs.worldpay.com/access/products/hosted-payment-pages/setup-a-payment)
- [HPP webhooks and event payloads](https://docs.worldpay.com/access/products/hosted-payment-pages/webhooks)
- [HMAC signature verification](https://docs.worldpay.com/access/products/events/signature)
