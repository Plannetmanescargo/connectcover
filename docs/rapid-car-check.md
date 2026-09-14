# Rapid Car Check vehicle lookup

Both QuoteWidget and /get-quote use POST /api/vehicle/lookup. The server calls
Rapid Car Check's standalone API. Checkout, fulfilment and the timezone fix are unchanged.

## One-time setup

Set these in Vercel's Production environment before deploying the PR, and in
.env.local if testing locally. Do not use NEXT_PUBLIC_ names for credentials.

| Variable | Value |
| --- | --- |
| RAPID_CAR_CHECK_API_KEY | Your standalone API key from API management |
| RAPID_CAR_CHECK_DOMAIN | Exactly the domain registered in API management, including www if registered that way |
| RAPID_CAR_CHECK_ENDPOINT | Optional. Defaults to https://www.rapidcarcheck.co.uk/api/ |

If the account gives a URL containing key, domain and plate query parameters,
put the key and domain in their separate variables. ENDPOINT is only the HTTPS
base URL before the question mark, with no query parameters. It must be hosted
on rapidcarcheck.co.uk or www.rapidcarcheck.co.uk. Keep the default unless the
standalone API management page specifies a different base endpoint.

Do not use the WordPress FreeAccess URL or the example key in the PDF.
No Rapid Car Check sandbox flag is sent. Only real results belong in production.
Do not add production credentials to Preview unless you intend those previews
to consume real credits and the provider permits that environment/domain.

The old VEHICLE_DATA_GLOBAL_* settings are no longer read by this endpoint.
No database migration or new npm dependency is required.

## Upgrading your allowance

There is no hardcoded 50-call allowance in the code. Increasing the allowance
on the same Basic API account should require no code or environment changes
provided Rapid Car Check retains the key, domain and endpoint. Switching API
products (for example to Premium) is different and may change the response.

## Request handling and credit use

- Search occurs only on the Check button or Enter, not on typing or page load.
- While a search runs the registration input is disabled; a synchronous guard
  prevents double submissions. A successful result remains in the form, and
  pressing Check again for that unchanged registration makes no further call.
- There are no automatic upstream retries. Server timeout is 10 seconds;
  browser timeout is 15 seconds. A timed-out provider request may still count.
- Concurrent lookups of the same plate share a request within one server instance.
- Results are not persistently cached. Reloading or starting another search can
  consume another call. Moving from the home widget to /get-quote uses the existing
  draft handoff and does not trigger another lookup automatically.
- A best-effort burst limit allows 10 requests per minute per Vercel client IP
  per instance. It is not a distributed quota or a guarantee against determined
  abuse; serverless instances can have independent counters. The provider's
  allowance remains authoritative. Consider Vercel WAF limits for public traffic.
- Missing configuration, quota errors, no match, partial records or service
  failures retain manual make/model entry. Make and model must both be present
  to proceed; year remains optional. Changing the plate clears all prior details.
- API credentials and raw provider payloads are not returned or logged. Only
  make/model/year/colour/fuel are sent to the browser. HTTPS verification is on.
- The required Powered by Rapid Car Check link is visible at both search forms.

## Validation

Run `node --test tests/vehicle-lookup.test.mjs tests/policy-date-time.test.mjs`
and `npx tsc --noEmit --incremental false`. Tests use synthetic provider responses
and make no live API calls. The response mapper follows the documented envelope
and BasicVehicleDetailsModel fields used by the provider's published plugin.

After adding your credentials and deploying, use one known vehicle to confirm
make, model and manufacturing year. Verify the provider counter changes as
expected. Check the same successful result again: it should not request again.
Try manual entry separately without performing a lookup to conserve credits.
A live authenticated response has not been verified during implementation;
if your account's schema differs, share a redacted response for adjustment.

## Sources

- https://www.rapidcarcheck.co.uk/Support/Rapid-Car-Check-API-Guide.pdf
- https://www.rapidcarcheck.co.uk/Support/ShortCodeList.csv
- https://www.rapidcarcheck.co.uk/api-status-and-error-codes/
- https://www.rapidcarcheck.co.uk/uk-vehicle-history-data-api-apps-websites/
- Official WordPress plugin: classes/Shortcodes.php, BasicVehicleDetails shortcode
  https://downloads.wordpress.org/plugin/free-vehicle-data-uk.latest-stable.zip

The plugin was inspected to confirm field paths; no PHP plugin code or credentials
were copied into the integration.
