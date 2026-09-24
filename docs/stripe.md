# Stripe alternative for Coverza

This integration adapts `connectc`'s Stripe-hosted Checkout and verified server-side fulfilment to Coverza. It uses Coverza's existing server pricing, purchase data, Supabase PDF storage, Resend delivery and newsletter flow. The PayPal checkout and waiting-page design are unchanged. Stripe returns to the same success page with a matching progress design and Stripe-specific wording.

## Choose the active processor

Set exactly one value in Vercel's **Production** environment, then redeploy:

| Processor | Variable | Other requirements |
| --- | --- | --- |
| Stripe | `PAYMENT_PROVIDER=stripe` | Stripe keys below |
| PayPal | `PAYMENT_PROVIDER=paypal` | Existing PayPal configuration and `PAYPAL_ENABLED=true` |
| Mollie | `PAYMENT_PROVIDER=mollie` | Existing Mollie configuration and `MOLLIE_ENABLED=true` |

Only new purchases switch. Keep previous providers' keys, webhooks and cron jobs active so already-started purchases finish. This is an operator-controlled switch, not three choices shown to the customer and not automatic failover. An unset value defaults to Mollie; invalid values fail closed. Keep `PAYMENT_PROVIDER=paypal` while preparing Stripe if you want PayPal to stay live.

## Environment variables

Configure both your local `.env` (where appropriate) and Vercel; local values are not deployed by Git:

```dotenv
# Keep paypal here until you are ready to route new purchases to Stripe.
PAYMENT_PROVIDER=paypal
STRIPE_SECRET_KEY=sk_live_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME
NEXT_PUBLIC_BASE_URL=https://www.coverza.uk
# Retain your existing CRON_SECRET, DATABASE_URL, DIRECT_URL,
# Supabase, Resend, INTERNAL_RENDER_KEY and other fulfilment settings.
```

The hosted redirect does not need `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, a Price ID, or separate Apple/Google API secrets. Stripe test/live mode is derived from the secret key. Use the endpoint signing secret from the SAME mode/account; the Stripe CLI's local `whsec_` is not the live endpoint secret. Never put either secret in a NEXT_PUBLIC variable or commit it.

Pending checkouts are bound to a hash of the Stripe secret key. Keep that key until pending orders are resolved. Rotating keys/changing accounts is a separate migration: this deliberately does not silently process old checkouts through a different account.

## Stripe Dashboard setup

1. Use the Stripe account receiving Coverza purchases and complete its live activation requirements.
2. In Workbench/Webhooks, add an event destination for **your account** with URL:
   `https://www.coverza.uk/api/stripe/webhook`
3. Select snapshot events (not thin events). Use API version `2025-12-15.clover` to match the installed SDK if the dashboard asks for a version.
4. Select these events:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `charge.refunded`
   - `charge.dispute.created`
5. Reveal this endpoint's signing secret and set `STRIPE_WEBHOOK_SECRET`.
6. Review Checkout branding and public business/support details in Stripe. The item name is **Coverza Vehicle Documents**, priced server-side in GBP. Discounts, promotion codes, shipping and adaptive currency conversion are not enabled by this integration.

The integration requests card payments. Hosted Checkout supports eligible Apple Pay and Google Pay as card wallets; their display depends on Stripe settings, the buyer's browser/device and a configured wallet. Review wallet enablement in Stripe's payment-method settings. PayPal's existing wallet/domain configuration is independent and remains untouched.

## Apply the migration BEFORE deploying the new code

The additive migration adds nullable Stripe recovery fields and indexes to PaymentCheckout. Existing PayPal/Mollie records are preserved. The new shared success-page query uses these columns, so apply it **before merging the PR triggers a production deployment**.

From a clean working tree in PowerShell, fetch the feature branch and run against your intended Supabase database (Prisma CLI reads `.env`):

```powershell
git fetch origin
if ($LASTEXITCODE -ne 0) { throw "Fetch failed. Stop here." }
git switch --track origin/feat/stripe-payment-alternative
if ($LASTEXITCODE -ne 0) { throw "Could not switch branch. Stop here." }
npm ci
if ($LASTEXITCODE -ne 0) { throw "Dependency installation failed. Stop here." }
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { throw "Migration failed. Stop here." }
```

If the branch already exists locally, use `git switch feat/stripe-payment-alternative` instead of the `--track` command. Do not force checkout over local changes.

Then:

1. Add the Stripe environment values and webhook endpoint; leave `PAYMENT_PROVIDER=paypal` for the initial deployment.
2. Merge the PR and let Vercel deploy. Verify the existing purchase flow still works.
3. Set `PAYMENT_PROVIDER=stripe` and redeploy when ready. Environment edits do not alter an existing deployment.
4. Check `/api/cron/stripe` is being called by Vercel each minute. It uses your existing CRON_SECRET and is included in vercel.json.
5. Run a controlled end-to-end purchase: payment, success page, both stored documents, and received email. Test card 3DS, cancellation, eligible wallets, webhook retry and provider rollback on an isolated test deployment using `sk_test_...` and its matching webhook first. Test payments also run document generation/email: use isolated data and your own recipient address.

No production keys, database migrations, payments, or deployments are performed by this code change itself.

## Reliability and support

- Creation uses a persisted attempt and stable Stripe idempotency key. Ambiguous creates stop before the minimum 24-hour key retention window instead of creating another session.
- Only a server-retrieved, correctly bound paid Session and succeeded PaymentIntent with the exact GBP amount can fulfil. A redirect or HTTP 200 alone is not proof of payment.
- Signed webhooks persist retry work before acknowledgement. Webhook, status and cron processing share a database lease; cron recovers interrupted PDF/email work.
- The success page waits for stored documents and Resend acceptance. Inbox delivery time remains external to the application.
- Refunds/disputes flag manual review; this does not automatically cancel documents or send a refund.
- Historical signed Square callbacks on the old `/api/stripe/webhook` URL remain supported. New `/api/stripe/checkout` calls now create Stripe sessions, not Square links.
- Logs identify checkout and processing stage without logging card details or secrets. For support, capture the checkout reference, Stripe Session/PaymentIntent IDs and expanded Vercel error row.

References: https://docs.stripe.com/checkout/fulfillment and https://docs.stripe.com/payments/accept-a-payment
