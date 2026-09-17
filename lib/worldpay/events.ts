export type WorldpayEvent = {
  eventId: string;
  eventDetails: {
    classification: string;
    transactionReference: string;
    type: string;
    merchant?: { entity?: string };
    paymentId?: string;
    amount?: { value?: number; currencyCode?: string };
  };
};

export function parseWorldpayEvent(value: unknown): WorldpayEvent {
  if (!value || typeof value !== "object") throw new Error("Invalid event");
  const event = value as WorldpayEvent;
  const detail = event.eventDetails;
  if (typeof event.eventId !== "string" || !event.eventId || !detail ||
      typeof detail.classification !== "string" || typeof detail.type !== "string" ||
      typeof detail.transactionReference !== "string" || !detail.transactionReference) throw new Error("Invalid event");
  if (detail.paymentId !== undefined && (typeof detail.paymentId !== "string" || !detail.paymentId)) throw new Error("Invalid payment ID");
  return event;
}

export function assertWorldpayPayment(event: WorldpayEvent, checkout: {
  worldpayTransactionReference: string | null; worldpayEntity: string | null;
  worldpayPaymentId: string | null; totalAmountPence: number; currency: string;
}) {
  const d = event.eventDetails;
  if (d.transactionReference !== checkout.worldpayTransactionReference ||
      (d.type !== "sentForSettlement" && d.type !== "settled") ||
      !Number.isSafeInteger(d.amount?.value) || d.amount?.value !== checkout.totalAmountPence ||
      checkout.totalAmountPence <= 0 || d.amount?.currencyCode !== checkout.currency || checkout.currency !== "GBP") {
    throw new Error("Payment reference, amount, currency or state mismatch");
  }
  // Older HPP events omit merchant/paymentId. The signature and unique reference
  // still bind those events to this checkout; validate the extra fields when present.
  if (d.merchant !== undefined && d.merchant?.entity !== checkout.worldpayEntity) throw new Error("Merchant mismatch");
  if (checkout.worldpayPaymentId && d.paymentId && checkout.worldpayPaymentId !== d.paymentId) throw new Error("Payment ID mismatch");
}
