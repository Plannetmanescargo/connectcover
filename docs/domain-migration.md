# Move Coverza to www.coverza.net

This change updates website metadata, canonical page redirects and setup examples. Checkout styling, pricing, payment verification and document delivery behavior are unchanged. No database migration is required.

## 1. Prepare Vercel and DNS before merging

Add `www.coverza.net` and `coverza.net` to the existing Coverza Vercel project. At your DNS provider, use the exact records Vercel supplies and wait for valid DNS and HTTPS certificates. The old website domain is unavailable and is not a prerequisite for this migration.

The application redirects only the new apex's ordinary GET/HEAD pages to `https://www.coverza.net`, preserving paths and query strings. API and `/.well-known/` routes are served directly. No redirect, callback or DNS setup on the old website is required or assumed.

Remove obsolete website-domain assignments from Vercel once the new domain is ready. Change every active provider's webhook destination, website URL and wallet registration to the new hostname. Do not remove email hosting or email-related DNS records: email addresses remain unchanged.

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

Keep `STRIPE_SECRET_KEY` unchanged. Update business website/public details in Stripe as applicable. Already-created hosted sessions retain their original return URLs, which will no longer work. Do not distribute old checkout links. Check provider payment status before inviting a customer to start a fresh checkout, so a paid order is not charged again. Current Stripe integration uses hosted Checkout, so this change does not introduce an embedded Stripe wallet domain registration requirement.

### PayPal (before offering PayPal on the new domain)

Update the existing live app webhook URL to `https://www.coverza.net/api/paypal/webhook`, retaining the existing event selections. If you recreate the webhook, update `PAYPAL_WEBHOOK_ID` and redeploy. Keep the existing live client ID, secret and merchant ID.

Register and verify `www.coverza.net` in the live app's Apple Pay domain settings. The existing association file is served at `https://www.coverza.net/.well-known/apple-developer-merchantid-domain-association`. Register each hostname that actually displays Apple Pay separately. Review Google Pay's configured website/domain approval for the new hostname if applicable. Remove obsolete website wallet-domain registrations after the new registration is verified.

### Mollie

New payments use the new `NEXT_PUBLIC_BASE_URL` to generate their webhook and return URLs automatically. Update the website URL in the Mollie profile. Existing payments retain their saved callback and return URLs, which will no longer be reachable. Review pending orders using the provider and the application’s reconciliation logs; do not rely on those old callbacks.

Existing records with a Mollie payment ID can still reconcile. Ambiguous payment creations without a stored payment ID may require review after an origin change because the creation configuration fingerprint includes the origin. Do not recreate or charge such payments blindly.

### Legacy integrations, if still used

Update Worldpay's configured webhook to `https://www.coverza.net/api/worldpay/webhook` and review any hostname-specific firewall rules. For legacy Square, `SQUARE_WEBHOOK_NOTIFICATION_URL` must exactly match its configured notification URL for signature verification; change both together only if moving that endpoint. Remove obsolete dashboard destinations after replacing them with the new endpoint. Review pending transactions that previously relied on the unavailable callback.

## 4. Email and other website links

Existing `support@coverza.uk` links and email sender/reply-to settings are intentionally retained. Keep `RESEND_FROM`, `RESEND_REPLY_TO` and working mailbox configuration unchanged. This code change does not establish or verify email-domain DNS: separately confirm that incoming support mail and outgoing Resend mail still work.
Update newsletter templates, social/profile links, advertising destinations and any manually configured external links to the new website. Supabase project URLs and storage buckets stay unchanged; if you use Supabase Auth outside this checkout flow, review its Site URL/allowed redirects separately.

## 5. Verify the cutover

- New domain loads with HTTPS; apex ordinary pages redirect to `www.coverza.net` with their path/query intact.
- New webhook endpoints are served directly, with no domain redirects; an unsigned manual request may correctly be rejected by the handler.
- Stripe's signed delivery test reaches the new endpoint and verifies successfully.
- A controlled checkout on the new domain completes, reaches success, creates retrievable documents and sends the email. Check Vercel, Stripe and Resend logs for that same checkout reference.
- Verify PayPal Apple Pay/Google Pay separately before enabling PayPal on the new domain.
- Review pending payments from before the switch. Cron reconciliation can recover supported records using the existing provider credentials, but verify each affected order’s paid/fulfilled status and email delivery. Old website links cannot be restored by this deployment.

Local automated tests do not confirm live DNS, dashboard settings or email delivery.
