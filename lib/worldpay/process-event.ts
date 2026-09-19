import { prisma } from "@/db/prisma";
import { finalizePolicy } from "@/lib/policy/finalize";
import { fulfillPolicy } from "@/lib/policy/fulfill";
import { assertWorldpayPayment, type WorldpayEvent } from "./events";

export async function processWorldpayEvent(event: WorldpayEvent, environment: string) {
  const started = Date.now();
  const d = event.eventDetails;
  if (d.classification !== "payment" || !d.transactionReference.startsWith(`wp_${environment}_`)) return;
  const checkout = await prisma.paymentCheckout.findUnique({ where: { worldpayTransactionReference: d.transactionReference } });
  if (!checkout) throw new Error("Worldpay checkout not found");
  if (checkout.paymentProvider !== "WORLDPAY" || checkout.brand !== "coverza" || checkout.worldpayEnvironment !== environment) {
    throw new Error("Worldpay checkout ownership mismatch");
  }
  if (d.merchant !== undefined && d.merchant?.entity !== checkout.worldpayEntity) throw new Error("Merchant mismatch");
  if (d.type !== "sentForSettlement" && d.type !== "settled") {
    // Refused/cancelled events may describe an earlier attempt. Never downgrade a paid checkout.
    const status = d.type === "expired" ? "EXPIRED" :
      ["refused", "cancelled", "error"].includes(d.type) ? "FAILED" : null;
    if (status) await prisma.paymentCheckout.updateMany({
      where: { id: checkout.id, status: { not: "PAID" } }, data: { status },
    });
    // Refunds/settlement failures need operational review, not automatic policy cancellation.
    if (["settlementFailed", "sentForRefund", "refunded", "refundFailed", "chargedBack"].includes(d.type)) {
      console.warn("[worldpay webhook] payment needs review", { checkoutId: checkout.id, eventId: event.eventId, type: d.type });
    }
    return;
  }
  assertWorldpayPayment(event, checkout);
  if (checkout.worldpayFulfilledAt) return;
  if (checkout.licenceType !== "UK" && checkout.licenceType !== "International" && checkout.licenceType !== "Learner") throw new Error("Invalid stored licence type");

  // The handler has a 60s runtime budget. The 90s database lease serializes
  // concurrent deliveries, and automatically recovers if a worker is killed.
  const now = new Date();
  const lease = new Date(now.getTime() + 90_000);
  const claim = await prisma.paymentCheckout.updateMany({
    where: { id: checkout.id, worldpayFulfilledAt: null, OR: [
      { worldpayProcessingUntil: null }, { worldpayProcessingUntil: { lte: now } },
    ] }, data: { worldpayProcessingUntil: lease },
  });
  if (claim.count !== 1) throw new Error("Worldpay checkout is already processing; retry delivery");
  try {
    // Another worker may have recorded a payment before releasing its lease.
    // Recheck under our lease before accepting this event's provider payment ID.
    const current = await prisma.paymentCheckout.findUnique({ where: { id: checkout.id } });
    if (!current) throw new Error("Worldpay checkout disappeared");
    assertWorldpayPayment(event, current);
    const policy = await finalizePolicy({
      vrm: checkout.vrm, make: checkout.make, model: checkout.model, year: checkout.year,
      startAt: checkout.startAt.toISOString(), endAt: checkout.endAt.toISOString(),
      durationMs: Number(checkout.durationMs), totalAmountPence: checkout.totalAmountPence,
      fullName: checkout.fullName, dob: checkout.dob.toISOString(), email: checkout.email,
      licenceType: checkout.licenceType, address: checkout.address,
      paymentProvider: "WORLDPAY",
      // One policy per checkout, even if event types expose different provider IDs.
      paymentId: d.transactionReference, paymentStatus: "PAID", currency: checkout.currency,
    });
    await prisma.paymentCheckout.update({ where: { id: checkout.id }, data: {
      status: "PAID", policyId: policy.policyId,
      ...(d.paymentId ? { worldpayPaymentId: d.paymentId } : {}),
    } });
    console.info("[worldpay webhook] policy confirmed", { checkoutId: checkout.id, eventId: event.eventId, elapsedMs: Date.now() - started });
    // The durable job remains pending on failure for the internal retry worker;
    // finalizePolicy and fulfillPolicy reuse the saved policy/documents/email events.
    await fulfillPolicy(policy.policyId, { durableEmail: true });
    await prisma.paymentCheckout.update({ where: { id: checkout.id }, data: { worldpayFulfilledAt: new Date() } });
  } finally {
    await prisma.paymentCheckout.updateMany({ where: { id: checkout.id, worldpayProcessingUntil: lease }, data: { worldpayProcessingUntil: null } });
  }
}
