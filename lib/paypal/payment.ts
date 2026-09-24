import { amountPence } from "../mollie/payment";
export type PayPalCapture = { id: string; status: string; final_capture?: boolean; amount: { currency_code: string; value: string } };
export type PayPalOrder = { id: string; intent: string; status: string; purchase_units: Array<{
  reference_id: string; custom_id: string; payee: { merchant_id: string };
  amount: { currency_code: string; value: string }; payments?: { captures?: PayPalCapture[] };
}>; payment_source?: { google_pay?: { card?: { authentication_result?: { liability_shift?: string } } } } };
export type CheckoutIdentity = { id: string; brand: string; paymentProvider: string; currency: string; totalAmountPence: number;
  paypalOrderId: string | null; paypalCaptureId: string | null; paypalMerchantId: string | null };
export const paypalIdValid = (id: unknown): id is string => typeof id === "string" && /^[A-Z0-9]{10,32}$/.test(id);
export function assertPayPalOrder(order: PayPalOrder, checkout: CheckoutIdentity) {
  const unit = order.purchase_units?.[0];
  if (!paypalIdValid(order.id) || order.intent !== "CAPTURE" || order.purchase_units?.length !== 1 ||
      checkout.paymentProvider !== "PAYPAL" || checkout.brand !== "coverza" ||
      (checkout.paypalOrderId && order.id !== checkout.paypalOrderId) ||
      unit?.reference_id !== checkout.id || unit?.custom_id !== `coverza:${checkout.id}` ||
      !checkout.paypalMerchantId || unit?.payee?.merchant_id !== checkout.paypalMerchantId ||
      unit?.amount?.currency_code !== checkout.currency || amountPence(unit.amount.value) !== checkout.totalAmountPence) {
    throw new Error("PayPal order does not match checkout");
  }
  const captures = unit.payments?.captures || [];
  if (captures.length > 1) throw new Error("Unexpected multiple captures");
  for (const capture of captures) {
    if (!paypalIdValid(capture.id) || (checkout.paypalCaptureId && capture.id !== checkout.paypalCaptureId) ||
        capture.amount.currency_code !== checkout.currency || amountPence(capture.amount.value) !== checkout.totalAmountPence) {
      throw new Error("PayPal capture does not match checkout");
    }
  }
  return captures[0];
}
export function assertGoogleAuthentication(order: PayPalOrder) {
  // Google Pay SCA: reject an explicit failed/unknown liability shift, while
  // permitting exempt payments for which PayPal supplies no authentication result.
  const shift = order.payment_source?.google_pay?.card?.authentication_result?.liability_shift;
  if (shift && shift !== "POSSIBLE") throw new Error("Google Pay authentication was not successful");
}

/** Refund events can link to their capture rather than include related_ids.
 * Parse only; never fetch a URL supplied by the event. */
export function captureIdFromLinks(links: Array<{ rel?: string; href?: string }> | undefined, api: string) {
  if (!Array.isArray(links)) return undefined;
  for (const link of links) {
    if (link.rel !== "up" || !link.href) continue;
    try {
      const url = new URL(link.href);
      const id = url.pathname.match(/^\/v2\/payments\/captures\/([A-Z0-9]{10,32})$/)?.[1];
      if (url.origin === api && !url.username && !url.password && id) return id;
    } catch { /* malformed link */ }
  }
  return undefined;
}
