# Mollie checkout setup

New quote payments use Mollie's hosted card checkout through the official `mollie-api-typescript` SDK. Existing Worldpay routes remain available for outstanding payments. A browser redirect alone cannot confirm payment: the server retrieves the payment from Mollie and checks its status, amount, currency, mode and checkout identity before running the existing document and email fulfilment.

## Mollie dashboard

Use the API key for the website profile approved for this business. Enable **Cards** on that profile; this integration requests `creditcard`, charges GBP and captures automatically. Other payment methods are not enabled by this change.

Copy the profile's **test API key** initially. After completing tests in an isolated test deployment, use its **live API key** in production. Keep both keys server-side; never prefix them with `NEXT_PUBLIC_` or commit them.

There are **no webhook events to select when creating this API key**. This integration uses Mollie's classic payment webhook, supplied in each create-payment request. Do not create a next-generation signed JSON webhook subscription for this endpoint: that is a different protocol.

For a deployment whose base URL is `https://www.coverza.uk`, the callback is:

```text
https://www.coverza.uk/api/mollie/webhook
```

It accepts Mollie's form POST containing `id=tr_...` and verifies the payment through the authenticated API. No webhook signing secret, publishable key or profile ID environment variable is needed. Mollie also notifies this callback about refunds and chargebacks; these are flagged for manual review, not automatic document cancellation.

## Environment

```dotenv
MOLLIE_ENABLED=true
MOLLIE_ENVIRONMENT=test
MOLLIE_API_KEY=test_REPLACE_WITH_YOUR_KEY
NEXT_PUBLIC_BASE_URL=https://YOUR-PUBLIC-TEST-HOST
CRON_SECRET=YOUR_EXISTING_SECRET_OR_A_NEW_RANDOM_SECRET
```

Use the existing `CRON_SECRET` if already configured for Worldpay. It protects the retry worker and is not a Mollie credential. Existing database, Supabase and Resend settings remain necessary.

`NEXT_PUBLIC_BASE_URL` must be the publicly reachable HTTPS origin of this deployment, with no path. Its webhook and redirect routes must not be blocked by preview authentication. Local testing needs a public HTTPS tunnel pointing to the local app; `localhost` cannot receive Mollie callbacks.

Use a separate test database and storage, and email addresses you control: a successful **test payment still runs document generation and email delivery**. Keep preview and production environments separate. Test and live payment keys cannot retrieve each other's payments.

For production, set `MOLLIE_ENVIRONMENT=live`, `MOLLIE_API_KEY=live_...` and the actual production `NEXT_PUBLIC_BASE_URL`, then redeploy. The API key prefix must match the configured mode. Leave `MOLLIE_ENABLED=false` to stop creation of new Mollie payments; existing reconciliation remains active.

## Database and deployment

The migration `20260923120000_add_mollie` adds the provider and payment/retry fields. Apply it to the target database before deploying the updated app. The Vercel build does not apply migrations automatically.

From this branch, with the correct target `DATABASE_URL` and `DIRECT_URL` configured for the Prisma CLI:

```powershell
npm ci
npx prisma migrate deploy
npm run build
```

Prisma CLI reads `.env`; do not assume values only in Next.js `.env.local` are available to it. Do not copy production credentials into tracked files.

`vercel.json` schedules `/api/cron/mollie` every minute. The deployment's scheduler must support this frequency and supply `Authorization: Bearer <CRON_SECRET>`. The worker retries four due checkouts per run; monitor and adjust capacity if traffic grows. Webhooks persist work before acknowledging it and attempt immediate processing, while this worker recovers interruptions.

## Acceptance checks before live use

1. Complete a successful test card checkout. Confirm the exact server-calculated GBP amount, one database policy/document record, Supabase files and the expected email.
2. Test failure, cancellation and an unfinished payment. None should issue documents or display a confirmed purchase.
3. Re-deliver the same classic callback and refresh the confirmation page. There should still be one purchase and no duplicate fulfilment email.
4. Confirm the retry worker is authorized and can recover a temporary fulfilment failure, including when the customer closes the browser.
5. Exercise refund/chargeback review in a supported test scenario. Inspect `mollieReviewReason`; handle refunds and any cancellation manually in your operational process.
6. Once live settings are deployed, make and verify a controlled real payment before opening checkout to customers.

Checkout retries reuse the same persisted attempt and Mollie idempotency key. Mollie retains idempotency keys for one hour: if payment creation remains ambiguous for 50 minutes, or the API key/base URL changes before the payment ID is saved, automatic creation stops for manual reconciliation. Inspect the checkout ID in Mollie's metadata before deciding whether another payment is needed. Existing known payment IDs continue to be retrieved rather than recreated.

Automated tests use mocked payments. They do not replace the hosted checkout, database migration, webhook reachability, real account capability, storage and email checks above.

## Official references

- SDK: https://github.com/mollie/mollie-api-typescript
- Create payment: https://docs.mollie.com/reference/create-payment
- Classic webhooks: https://docs.mollie.com/reference/webhooks
- Idempotency: https://docs.mollie.com/reference/api-idempotency
- Test payments: https://help.mollie.com/hc/en-us/articles/214041689-How-do-I-test-the-payment-methods-and-webhook-on-my-website
