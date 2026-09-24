import type { PaymentCheckout } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { finalizePolicy } from "@/lib/policy/finalize";
import { fulfillPolicy } from "@/lib/policy/fulfill";
import { getPayPalConfig } from "./config";
import { paypalRequest, PayPalError } from "./client";
import { assertPayPalOrder, assertGoogleAuthentication, type PayPalOrder } from "./payment";

export async function ensurePayPalOrder(checkout: PaymentCheckout) {
  const c = getPayPalConfig();
  if (checkout.paymentProvider !== "PAYPAL" || checkout.paypalMode !== c.mode || checkout.paypalConfigHash !== c.fingerprint) throw new Error("Checkout configuration mismatch");
  if (checkout.paypalOrderId) return checkout;
  // PayPal retains request IDs for six hours by default. Stop before expiry.
  if (Date.now() - checkout.createdAt.getTime() > 5 * 3600_000) {
    await prisma.paymentCheckout.update({ where: { id: checkout.id }, data: {
      paypalReviewReason: "Unresolved order creation. Check PayPal before retrying.", paypalNextAttemptAt: null,
    } });
    throw new Error("Order creation needs review");
  }
  const order = await paypalRequest<PayPalOrder>("/v2/checkout/orders", {
    intent: "CAPTURE", purchase_units: [{ reference_id: checkout.id, custom_id: `coverza:${checkout.id}`,
      description: "Coverza Vehicle Documents", payee: { merchant_id: c.merchantId },
      amount: { currency_code: checkout.currency, value: (checkout.totalAmountPence / 100).toFixed(2) } }],
  }, `create-${checkout.id}`);
  assertPayPalOrder(order, checkout);
  return prisma.paymentCheckout.update({ where: { id: checkout.id }, data: { paypalOrderId: order.id } });
}

export async function reconcilePayPalCheckout(id: string, immediate = false) {
  const c = getPayPalConfig(); const now = new Date(); const lease = new Date(now.getTime() + 90_000);
  const claim = await prisma.paymentCheckout.updateMany({ where: {
    id, paymentProvider: "PAYPAL", brand: "coverza", paypalMode: c.mode, paypalConfigHash: c.fingerprint,
    paypalReviewReason: null,
    ...(immediate ? {} : { paypalNextAttemptAt: { lte: now } }),
    OR: [{ paypalProcessingUntil: null }, { paypalProcessingUntil: { lte: now } }],
  }, data: { paypalProcessingUntil: lease, paypalNextAttemptAt: new Date(now.getTime() + 60_000) } });
  if (!claim.count) return;
  try {
    let checkout = await prisma.paymentCheckout.findUniqueOrThrow({ where: { id } });
    checkout = await ensurePayPalOrder(checkout);
    const path = `/v2/checkout/orders/${checkout.paypalOrderId}`;
    let order: PayPalOrder;
    try { order = await paypalRequest<PayPalOrder>(path); }
    catch (error) {
      if (error instanceof PayPalError && error.status === 404 && Date.now() - checkout.createdAt.getTime() > 6 * 3600_000) {
        await prisma.paymentCheckout.update({ where: { id }, data: checkout.paypalCaptureStartedAt || checkout.status === "PAID"
          ? { paypalReviewReason: "Previously attempted payment is no longer queryable. Check PayPal.", paypalNextAttemptAt: null }
          : { status: "EXPIRED", paypalNextAttemptAt: null } });
        return;
      }
      throw error;
    }
    let capture = assertPayPalOrder(order, checkout);
    if (order.status === "APPROVED" && !capture) {
      assertGoogleAuthentication(order);
      if (checkout.paypalCaptureStartedAt && Date.now() - checkout.paypalCaptureStartedAt.getTime() > 5 * 3600_000) {
        await prisma.paymentCheckout.update({ where: { id }, data: { paypalReviewReason: "Ambiguous capture exceeded retry window. Check PayPal before retrying.", paypalNextAttemptAt: null } });
        return;
      }
      if (!checkout.paypalCaptureStartedAt) await prisma.paymentCheckout.update({ where: { id }, data: { paypalCaptureStartedAt: new Date() } });
      try { await paypalRequest<PayPalOrder>(`${path}/capture`, {}, `capture-${checkout.id}`); }
      catch (error) {
        // A capture may already have succeeded even if its response was lost.
        // Always read authoritative state before retrying with the same key.
        if (!(error instanceof PayPalError) || error.status !== 422) throw error;
      }
      order = await paypalRequest<PayPalOrder>(path);
      capture = assertPayPalOrder(order, checkout);
    }
    if (capture) await prisma.paymentCheckout.update({ where: { id }, data: { paypalCaptureId: capture.id } });
    if (capture && ["REFUNDED", "PARTIALLY_REFUNDED", "REVERSED"].includes(capture.status)) {
      await prisma.paymentCheckout.update({ where: { id }, data: { paypalReviewReason: "Refund or reversal requires manual review.", paypalNextAttemptAt: null } });
      return;
    }
    if (capture?.status !== "COMPLETED" || order.status !== "COMPLETED") {
      const failed = capture && ["DECLINED", "FAILED", "DENIED"].includes(capture.status);
      const expired = !capture && order.status !== "APPROVED" && Date.now() - checkout.createdAt.getTime() > 24 * 3600_000;
      if (failed || expired || order.status === "VOIDED") {
        await prisma.paymentCheckout.updateMany({ where: { id, status: { not: "PAID" } }, data: { status: failed ? "FAILED" : "EXPIRED", paypalNextAttemptAt: null } });
      }
      return;
    }
    // Re-check a refund/dispute flag that may have arrived during API calls.
    const latest = await prisma.paymentCheckout.findUniqueOrThrow({ where: { id } });
    if (latest.paypalReviewReason) return;
    if (checkout.paypalFulfilledAt) {
      await prisma.paymentCheckout.update({ where: { id }, data: { paypalNextAttemptAt: null } }); return;
    }
    if (!["UK", "International", "Learner"].includes(checkout.licenceType)) throw new Error("Invalid licence");
    const policy = await finalizePolicy({
      vrm: checkout.vrm, make: checkout.make, model: checkout.model, year: checkout.year,
      startAt: checkout.startAt.toISOString(), endAt: checkout.endAt.toISOString(), durationMs: Number(checkout.durationMs),
      totalAmountPence: checkout.totalAmountPence, fullName: checkout.fullName, dob: checkout.dob.toISOString(),
      email: checkout.email, licenceType: checkout.licenceType as "UK" | "International" | "Learner", address: checkout.address,
      paymentProvider: "PAYPAL", paymentId: capture.id, paymentStatus: "PAID", currency: checkout.currency,
    });
    await prisma.paymentCheckout.update({ where: { id }, data: { status: "PAID", policyId: policy.policyId } });
    await fulfillPolicy(policy.policyId, { durableEmail: true });
    await prisma.paymentCheckout.update({ where: { id }, data: { paypalFulfilledAt: new Date(), paypalNextAttemptAt: null } });
  } catch {
    console.error("[paypal] reconciliation needs retry", { checkoutId: id });
    throw new Error("PayPal reconciliation needs retry");
  } finally {
    await prisma.paymentCheckout.updateMany({ where: { id, paypalProcessingUntil: lease }, data: { paypalProcessingUntil: null } });
  }
}
export async function drainPayPalCheckouts() {
  const c = getPayPalConfig(); const now = new Date();
  const rows = await prisma.paymentCheckout.findMany({ where: {
    paymentProvider: "PAYPAL", paypalMode: c.mode, paypalConfigHash: c.fingerprint, paypalReviewReason: null,
    paypalNextAttemptAt: { lte: now }, OR: [{ paypalProcessingUntil: null }, { paypalProcessingUntil: { lte: now } }],
  }, orderBy: { paypalNextAttemptAt: "asc" }, take: 4, select: { id: true } });
  await Promise.allSettled(rows.map(row => reconcilePayPalCheckout(row.id)));
}
