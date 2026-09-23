export type MolliePayment = {
  id: string; mode: string; profileId: string; status: string;
  amount: { value: string; currency: string };
  metadata?: unknown;
  amountRefunded?: { value: string };
  amountChargedBack?: { value: string };
  links?: { checkout?: { href: string } | null };
};
export type MollieCheckoutIdentity = {
  id: string; brand: string; paymentProvider: string; currency: string;
  totalAmountPence: number; mollieMode: string | null;
  molliePaymentId: string | null; mollieProfileId: string | null;
};
export const paymentIdValid = (id: unknown): id is string => typeof id === "string" && /^tr_[A-Za-z0-9]{5,100}$/.test(id);
export function amountPence(value: string): number {
  if (!/^\d+\.\d{2}$/.test(value)) throw new Error("Invalid payment amount");
  const [whole, fraction] = value.split(".");
  const pence = Number(whole) * 100 + Number(fraction);
  if (!Number.isSafeInteger(pence)) throw new Error("Invalid payment amount");
  return pence;
}
export function assertMolliePayment(payment: MolliePayment, checkout: MollieCheckoutIdentity) {
  const metadata = payment.metadata as { checkoutId?: unknown; brand?: unknown } | null;
  if (!paymentIdValid(payment.id) || checkout.paymentProvider !== "MOLLIE" || checkout.brand !== "coverza" ||
      payment.mode !== checkout.mollieMode || !payment.profileId ||
      (checkout.molliePaymentId && payment.id !== checkout.molliePaymentId) ||
      (checkout.mollieProfileId && payment.profileId !== checkout.mollieProfileId) ||
      metadata?.checkoutId !== checkout.id || metadata?.brand !== checkout.brand ||
      payment.amount.currency !== checkout.currency || amountPence(payment.amount.value) !== checkout.totalAmountPence) {
    throw new Error("Mollie payment does not match the stored checkout");
  }
}
export function paymentNeedsReview(payment: MolliePayment) {
  return amountPence(payment.amountRefunded?.value || "0.00") > 0 ||
    amountPence(payment.amountChargedBack?.value || "0.00") > 0;
}
export function checkoutUrl(payment: MolliePayment) {
  const url = new URL(payment.links?.checkout?.href || "");
  if (url.protocol !== "https:" || url.username || url.password || url.port ||
      !(url.hostname === "mollie.com" || url.hostname.endsWith(".mollie.com"))) throw new Error("Invalid Mollie checkout URL");
  return url.href;
}
