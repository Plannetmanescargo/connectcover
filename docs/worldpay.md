# Worldpay Hosted Payment Pages

This integration uses Access Worldpay HPP v1, matching the supplied documentation. It does not use Worldpay Online Payments XML or the older Business Gateway installation ID API.

## Routes and retained fallback

- `POST /api/worldpay/checkout` creates a hosted checkout.
- `POST /api/worldpay/webhook` authenticates the source before processing events: a Vercel source-IP allowlist for WPecom, or HMAC for Enterprise.
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
| `WORLDPAY_WEBHOOK_SECURITY` | **`vercel-ip` for this WPecom account.** Use `hmac` only for an Enterprise account with signing enabled. Omitting it preserves the original HMAC requirement. |
| `WORLDPAY_WEBHOOK_KEY_ID` | Enterprise HMAC mode only; leave unset for WPecom. |
| `WORLDPAY_WEBHOOK_SECRET` | Enterprise HMAC mode only; leave unset for WPecom. |
| `NEXT_PUBLIC_BASE_URL` | Canonical HTTPS website origin, e.g. `https://www.coverza.uk`. No path or query. |

Existing Prisma, Supabase, Resend and internal PDF-rendering variables remain required. Leave the existing Square/Stripe variables available for the retained routes.

## Webhook registration

For the current canonical hostname in the repository, register:

`https://www.coverza.uk/api/worldpay/webhook`

If deploying on a different hostname, substitute that site's canonical origin. The endpoint must be publicly reachable over HTTPS without login, a deployment protection page or a redirect.

Worldpay integration support confirmed on 2026-09-19 that this account is **WPecom**, its supported events are already enabled, and HMAC is currently Enterprise-only. The URL is already registered in Live mode. A future WPecom HMAC rollout has no confirmed date; do not wait for or invent signing credentials.

1. Keep the existing registered URL, provided that hostname connects directly to Vercel. Configure the firewall below.
2. Set `WORLDPAY_WEBHOOK_SECURITY=vercel-ip` and the API variables above in Vercel, then redeploy the corrected code. HMAC key/secret variables are not required or read in this mode.
3. Verify the deployment receives real Worldpay traffic from an approved IP and that an ordinary/spoofed-header request is blocked. An Active label in Worldpay confirms registration, not successful delivery.
4. Complete the payment acceptance test below. `authorized` and `sentForAuthorization` do not issue policies. `sentForSettlement` triggers issuance after payment checks; `settled` can recover issuance if delivered. `tokenCreated` is safely acknowledged without storing a card or issuing a policy.

## WPecom source IP and Vercel firewall

The handler accepts exactly the 33 IPv4 addresses published in Worldpay's [HPP webhook documentation](https://docs.worldpay.com/access/products/hosted-payment-pages/webhooks), checked 2026-09-19. The source list is `lib/worldpay/source-ip.ts`; a copy for the firewall is in [worldpay-webhook-ips.txt](worldpay-webhook-ips.txt). Update both and the deployed firewall rule if Worldpay changes its list.

Configure a **Vercel project firewall custom rule**:

| Field | Setting |
| --- | --- |
| Name | Worldpay webhook sources |
| Condition 1 | Request Path **Equals** `/api/worldpay/webhook` |
| Combine | **AND** |
| Condition 2 | IP Address **Is not any of** all addresses in `worldpay-webhook-ips.txt` |
| Action | **Deny** (not Challenge or Log) |

Apply the rule across the project's hostnames, including `*.vercel.app`, and to any environment receiving Worldpay webhooks. Do not restrict it only to the public hostname, do not add a method condition, and do not block non-Worldpay visitors to the rest of the website. Check that no earlier Bypass rule skips it. Cover the trailing-slash path too if enabled; the application checks all requests that reach this route regardless of URL spelling.

In Vercel: Project → Firewall → Configure → Add New Rule. Review and publish the rule. If legitimate Worldpay requests encounter existing browser challenges or rate limits, any exception must be limited to **this path AND the approved IP list**. Do not create a global bypass.

The route also enforces the allowlist before reading payment data. It uses only Vercel's `x-vercel-forwarded-for`; missing, malformed, multi-address and unapproved values get HTTP 403. It never falls back to `X-Forwarded-For`, `X-Real-IP`, `CF-Connecting-IP`, a query secret or a user-supplied bypass. Vercel documents its source-IP headers and proxy handling [here](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for).

This mode requires an actual deployed Vercel runtime (`VERCEL=1` supplied by Vercel and `NODE_ENV=production`). Do not manually set those variables locally to trust fabricated headers. Local/self-hosted IP mode refuses to run. Use a Vercel test deployment for Worldpay sandbox delivery.

**Proxy requirement:** Worldpay must connect directly to Vercel. If Cloudflare or another reverse proxy fronts the registered hostname, Vercel may see the proxy's IP; the request will be rejected. Do not add the proxy's shared IP ranges or trust its client-IP header. Configure a DNS-only hostname attached to the same Vercel project for the webhook, register that HTTPS URL in Worldpay, and keep the same endpoint path. Changing the webhook hostname does not change the checkout return origin. Verify actual routing before selecting Live mode.

After deploying, send an ordinary request and one with forged forwarding headers from your computer; **both must be denied** (403). Example in PowerShell:

```powershell
curl.exe -i -X POST "https://www.coverza.uk/api/worldpay/webhook" -H "Content-Type: application/json" --data "{}"
curl.exe -i -X POST "https://www.coverza.uk/api/worldpay/webhook" -H "Content-Type: application/json" -H "x-vercel-forwarded-for: 34.246.73.11" -H "x-forwarded-for: 34.246.73.11" --data "{}"
```

A real Worldpay delivery must then succeed and issue exactly one policy after matching the stored GBP amount and reference. A 503 indicates missing security/environment configuration; a 400 from the forged-header test means the source gate was not enforced before JSON validation and must be investigated. Check the firewall logs and runtime logs together. Mocked unit tests cannot prove deployed ingress/header behavior.

The code change does not publish the Vercel firewall rule or configure DNS. Those deployment steps remain necessary before accepting live payments.

### Enterprise mode only

`WORLDPAY_WEBHOOK_SECURITY=hmac` retains the original HMAC verification using `WORLDPAY_WEBHOOK_KEY_ID` and `WORLDPAY_WEBHOOK_SECRET`. Missing signing details or a bad signature never cause fallback to IP mode. This is not usable for this WPecom account until Worldpay explicitly enables signing.

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
4. Complete a Worldpay test checkout. Check the amount, return URL, source-authenticated webhook, one policy, PDF storage and email delivery. Replay the event and confirm it does not create another policy or email.
5. Validate refused/cancelled payment returns and the awaiting-confirmation page. They must not show active cover.
6. After sandbox verification, configure matching live credentials, live entity and WPecom IP security against the production database. Apply the production migration, merge/deploy, then run an authorized low-value live purchase and check the complete flow before opening checkout generally.

The source change alone does not register the webhook, set Vercel secrets, apply a database migration or activate the merchant account. These require the account configuration above.

## Payment integrity and retries

- The server recomputes the amount from the quote page's shared rate card and verifies the selected period. Client-supplied totals cannot reduce the price.
- Each stored checkout has its own opaque, environment-prefixed transaction reference and stores the Worldpay entity. The reference is also the stable policy idempotency key.
- Authenticated settlement events must match the stored reference, exact GBP amount, provider and environment; merchant and payment IDs are checked when supplied.
- Legacy HPP event shapes without merchant/payment IDs are accepted only after source authentication and with matching reference/amount/currency.
- In Enterprise mode, `Event-Signature` uses `keyId/SHA256/signature`; multiple header entries are selected by configured key ID. Hex and canonical padded base64 digest encodings are accepted.
- A 90-second database lease serializes duplicate deliveries. The route runtime budget is 60 seconds. Failed fulfilment releases the lease; a killed worker's lease expires for a later retry.
- Policy creation, PDFs and email are awaited before acknowledging successful processing. Worldpay may retry after 10 seconds; an overlapping request fails for retry while the worker holds the lease. Once fulfilment succeeds, later events are acknowledged without running it again. No untracked background promise is used.
- Monitor non-200 webhook responses and reconcile paid Worldpay transactions that remain unfulfilled. Worldpay retries for a limited period (documented as up to one week); replay through Worldpay after correcting configuration or downstream failures. Long-running fulfilment must complete within the route's runtime budget.
- Do not rotate API environments in place while their events are still pending. Use separate sandbox/live deployments and matching API/environment settings.
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
- [Vercel source IP headers](https://vercel.com/docs/headers/request-headers)
- [Vercel firewall rule conditions](https://vercel.com/docs/vercel-firewall/vercel-waf/rule-configuration)
- [HMAC signature verification (Enterprise)](https://docs.worldpay.com/access/products/events/signature)
