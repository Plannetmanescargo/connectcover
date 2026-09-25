# Move Coverza to www.coverza.net

This change updates website metadata, canonical page redirects and setup examples. Checkout styling, pricing, payment verification and document delivery behavior are unchanged. No database migration is required.

## 1. Prepare Vercel and DNS before merging

Add `www.coverza.net` and `coverza.net` to the existing Coverza Vercel project. At your DNS provider, use the exact records Vercel supplies and wait for valid DNS and HTTPS certificates. Keep `coverza.uk` and `www.coverza.uk` attached to this same project with working DNS/HTTPS.

Do **not** configure a Vercel whole-domain redirect for the old domains: existing payment webhooks must continue to reach their original URLs directly. This application's middleware redirects ordinary GET/HEAD pages to `https://www.coverza.net`, preserving paths and query strings, but serves `/api` and `/.well-known/` directly on each domain. POST requests stay on their original origin. Avoid switching during an in-flight payment creation; leave existing return links and callbacks reachable.

## 2. Environment variables and deployment

Set these in local environment files and Vercel Production (and any other environment intentionally using the new public domain):

```dotenv
NEXT_PUBLIC_BASE_URL=https://www.coverza.net
NEXT_PUBLIC_SITE_URL=https://www.coverza.net
SITE_URL=https://www.coverza.net
```

Use the origin only: no path or trailing slash. `NEXT_PUBLIC_BASE_URL` builds new checkout return/cancel/webhook URLs. Document rendering uses `SITE_URL` first, then `NEXT_PUBLIC_SITE_URL`, then `NEXT_PUBLIC_BASE_URL`: update every old value, otherwise payment can succeed while document rendering targets the wrong site.

Merge this PR once the new domain is ready, and redeploy with the new environment values. Existing deployments do not pick up edited environment variables automatically. Keep `PAYMENT_PROVIDER` set to the intended active provider (`stripe`, `paypal` or `mollie`).

Keep database URLs, Supabase credentials, payment API keys, internal rendering credentials and cron secrets unchanged. The vehicle lookup uses Vehicle Data Global; its API endpoint/key do not change with your website domain. Review domain allowlists in external services only if you configured them.

## 3. Payment dashboards

### Stripe

Change the existing webhook destination URL to:

```
https://www.coverza.net/api/stripe/webhook
```

Keep the same events listed in `docs/stripe.md`. Verify `STRIPE_WEBHOOK_SECRET` matches that destination. Creating a new destination gives it a different signing secret; update the environment and redeploy if you do this. This handler uses a single signing secret, so do not assume two destinations with different secrets will both verify.

Keep `STRIPE_SECRET_KEY` unchanged. Update business website/public details in Stripe as applicable. Already-created hosted sessions retain their original return URLs; old browser-return redirects must stay available. Current Stripe integration uses hosted Checkout, so this change does not introduce an embedded Stripe wallet domain registration requirement.

### PayPal (before offering PayPal on the new domain)

Update the existing live app webhook URL to `https://www.coverza.net/api/paypal/webhook`, retaining the existing event selections. If you recreate the webhook, update `PAYPAL_WEBHOOK_ID` and redeploy. Keep the existing live client ID, secret and merchant ID.

Register and verify `www.coverza.net` in the live app's Apple Pay domain settings. The existing association file is served at `https://www.coverza.net/.well-known/apple-developer-merchantid-domain-association`. Register each hostname that actually displays Apple Pay separately. Review Google Pay's configured website/domain approval for the new hostname if applicable. Keep old registrations while old checkout tabs are still in use.

### Mollie

New payments use the new `NEXT_PUBLIC_BASE_URL` to generate their webhook and return URLs automatically. Update the website URL in the Mollie profile. Keep the old `/api/mollie/webhook` accessible for existing payments, whose saved callback URLs do not change.

Existing records with a Mollie payment ID can still reconcile. Ambiguous payment creations without a stored payment ID may require review after an origin change because the creation configuration fingerprint includes the origin. Do not recreate or charge such payments blindly.

### Legacy integrations, if still used

Update Worldpay's configured webhook to `https://www.coverza.net/api/worldpay/webhook` and review any hostname-specific firewall rules. For legacy Square, `SQUARE_WEBHOOK_NOTIFICATION_URL` must exactly match its configured notification URL for signature verification; change both together only if moving that endpoint. Keep old callback routes reachable for pending transactions.

## 4. Email and other website links

This is a website migration. Existing `support@coverza.uk` links and email sender/reply-to settings are intentionally retained until the new mailboxes are provisioned. Moving email is a separate step: configure mail hosting/MX, verify the new sending domain in Resend with its supplied DNS records, then update `RESEND_FROM`, `RESEND_REPLY_TO` and customer-facing email addresses. Do not replace email addresses just because the website moved.

Update newsletter templates, social/profile links, advertising destinations and any manually configured external links to the new website. Supabase project URLs and storage buckets stay unchanged; if you use Supabase Auth outside this checkout flow, review its Site URL/allowed redirects separately.

## 5. Verify the cutover

- New domain loads with HTTPS; apex and old ordinary pages redirect to `www.coverza.net` with their path/query intact.
- Old webhook endpoints are served directly, with no domain redirects; an unsigned manual request may correctly be rejected by the handler.
- Stripe's signed delivery test reaches the new endpoint and verifies successfully.
- A controlled checkout on the new domain completes, reaches success, creates retrievable documents and sends the email. Check Vercel, Stripe and Resend logs for that same checkout reference.
- Verify PayPal Apple Pay/Google Pay separately before enabling PayPal on the new domain.
- Keep the old domain/DNS/certificate active for existing payment callbacks and previously sent links. Do not retire it just because new checkouts work.

Local automated tests do not confirm live DNS, dashboard settings or email delivery.
