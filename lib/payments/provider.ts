/** Only new purchases switch; provider callbacks and recovery remain active. */
export function activePaymentProvider() {
  const value = process.env.PAYMENT_PROVIDER?.trim().toLowerCase() || "mollie";
  if (value !== "mollie" && value !== "paypal") throw new Error("Invalid PAYMENT_PROVIDER");
  return value;
}
