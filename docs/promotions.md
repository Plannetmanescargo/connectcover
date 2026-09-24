# Coverza discount codes

SEPT10 gives 10% off the purchase amount on the review step of `/get-quote`, before redirecting to a payment provider. Enter the code and select Apply. The page shows the original total, the saving, and the final total; Remove restores full price. The Pay button and mobile payment bar use the same final total.

- Case-insensitive; surrounding spaces are ignored.
- Available for new purchases by both new and returning customers. No first-purchase restriction or automatic expiry has been configured because none was specified.
- One code per purchase; no stacking. Unknown codes are rejected.
- Saving is rounded to the nearest penny once on the whole purchase, then subtracted from the original amount. Example: £1.99 minus £0.20 = £1.79.
- Server pricing independently recalculates the original price and allowed saving. Client-supplied discounts or reduced totals without a valid code are rejected.
- Stripe, PayPal and Mollie receive the same discounted amount. Existing amount verification and document/email fulfilment use the saved final amount. No provider-specific coupon is required; Stripe's own promotion-code field remains disabled to prevent double discounts.
- Existing payment sessions retain the amount agreed when created. Applying/removing the code before starting payment changes the request payload and therefore the checkout attempt key.
- The final amount is persisted in PaymentCheckout/Policy; this patch does not add a separate campaign redemption ledger.

## Release

Merge and deploy. No migration or new environment variables are needed. Refresh any already-open purchase page to load the new field. Before sending the campaign, make a controlled live purchase using SEPT10 and confirm the provider amount, success page, documents and email. Automated provider tests do not replace that live check.

Email wording: “Enter SEPT10 on the purchase review step and select Apply to save 10%.” Do not claim an expiry date, first-time-only eligibility or retrospective discounts. Set a campaign end date explicitly in a later change if required.

To withdraw the offer, change the shared promotion allowlist and deploy. Already-created sessions and paid orders continue to reconcile against their saved amounts.
