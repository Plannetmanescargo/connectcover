# Vehicle Data Global registration lookup

`POST /api/vehicle/lookup` uses Vehicle Data Global exclusively. Its request
(`{ vrm }`) and response (`{ ok, vrm, summary }`) remain unchanged for both forms.
Manual entry remains available if lookup fails.

## Configuration

Set server-side variables in `.env.local` and the appropriate Vercel environments:

```dotenv
VEHICLE_DATA_GLOBAL_ENDPOINT=https://uk.api.vehicledataglobal.com/r2/lookup
VEHICLE_DATA_GLOBAL_API_KEY=YOUR_NEW_KEY
VEHICLE_DATA_GLOBAL_PACKAGE=VehicleDetails
```

The key is required; endpoint and package default to the values above. The key
must have access to the exact package name in your VDG account and available
credit/allowance. If your account uses a custom package, use its exact name.
Check any account IP restrictions with VDG before deploying on Vercel.
Do not put the key in a NEXT_PUBLIC variable or commit it to Git.

The r2 GET parameters (`apiKey`, `packageName`, `vrm`) are restored from this
repository's original VDG integration. Confirm the r2 endpoint and package in
your current VDG control panel before rollout; public gateway documentation
refers customers to that panel. No new domain variable or webhook is used.

Remove obsolete RAPID_CAR_CHECK_API_KEY, RAPID_CAR_CHECK_DOMAIN and
RAPID_CAR_CHECK_ENDPOINT environment settings after deploying this change.
Changing environment values alone does not switch the previous code's provider.
Restart local development after editing `.env.local`; redeploy after updating
Vercel environment settings.

## Behaviour and verification

- Uppercase, space-free registrations; invalid input is rejected before lookup.
- Only the approved HTTPS r2 endpoint can receive the key; redirects are blocked.
- Ten-second timeout, no automatic retries, no raw provider payload or error leak.
- Current burst limiting and concurrent request deduplication remain in place.
- Only make, model, year, colour and fuel type are returned to the browser.
- Provider attribution is updated on both existing lookup forms.

Run `node --test tests/vehicle-lookup.test.mjs` after installing dependencies.
These use mocked requests and consume no lookup credits. After configuring your
key, try one known registration in the quote form, check make/model/year, and
confirm manual entry still works. No live account lookup was performed during
the migration.

References:
- Original repository integration: commit 1d3abac, app/api/vehicle/lookup/route.ts
- https://vehicledataglobal.com/DataSources/DVLA (VehicleDetails field example)
- https://uk.api.vehicledataglobal.com/ (control-panel documentation notice)
