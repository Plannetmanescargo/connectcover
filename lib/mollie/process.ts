import type { PaymentCheckout } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { finalizePolicy } from "@/lib/policy/finalize";
import { fulfillPolicy } from "@/lib/policy/fulfill";
import { getMollieConfig } from "./config";
import { mollieClient } from "./client";
import { assertMolliePayment, checkoutUrl, paymentNeedsReview } from "./payment";

export async function ensureMolliePayment(checkout: PaymentCheckout) {
  const config = getMollieConfig();
  if (checkout.paymentProvider !== "MOLLIE" || checkout.mollieMode !== config.mode) throw new Error("Checkout mode mismatch");
  if (checkout.molliePaymentId) return checkout;
  // Never recreate a payment after the provider's idempotency retention window.
  if (Date.now() - checkout.createdAt.getTime() > 50 * 60_000 || checkout.mollieConfigHash !== config.fingerprint) {
    await prisma.paymentCheckout.update({ where: { id: checkout.id }, data: {
      mollieReviewReason: "Payment creation could not be reconciled within its retry window or configuration changed. Check Mollie manually.",
      mollieNextAttemptAt: null,
    } });
    throw new Error("Checkout creation needs manual reconciliation");
  }
  const payment = await mollieClient().payments.create({
    idempotencyKey: `coverza-mollie-${checkout.id}`,
    paymentRequest: {
      amount: { currency: checkout.currency, value: (checkout.totalAmountPence / 100).toFixed(2) },
      description: `Coverza vehicle cover - ${checkout.id}`,
      redirectUrl: `${config.origin}/checkout/success?provider=mollie&checkout_id=${encodeURIComponent(checkout.id)}`,
      webhookUrl: `${config.origin}/api/mollie/webhook`,
      metadata: { checkoutId: checkout.id, brand: checkout.brand },
      locale: "en_GB", captureMode: "automatic", sequenceType: "oneoff",
      // Start with cards; enable additional methods only when their required data is supported.
      method: "creditcard",
      billingAddress: { email: checkout.email },
    },
  });
  assertMolliePayment(payment, checkout);
  return prisma.paymentCheckout.update({ where: { id: checkout.id }, data: {
    molliePaymentId: payment.id, mollieProfileId: payment.profileId, mollieCheckoutUrl: checkoutUrl(payment),
  } });
}

export async function reconcileMollieCheckout(id: string) {
  const config = getMollieConfig();
  const now = new Date(); const lease = new Date(now.getTime() + 90_000);
  const claim = await prisma.paymentCheckout.updateMany({ where: {
    id, paymentProvider: "MOLLIE", brand: "coverza", mollieMode: config.mode,
    mollieNextAttemptAt: { lte: now },
    OR: [{ mollieProcessingUntil: null }, { mollieProcessingUntil: { lte: now } }],
  }, data: { mollieProcessingUntil: lease, mollieNextAttemptAt: new Date(now.getTime() + 60_000) } });
  if (!claim.count) return;
  try {
    let checkout = await prisma.paymentCheckout.findUniqueOrThrow({ where: { id } });
    checkout = await ensureMolliePayment(checkout);
    const payment = await mollieClient().payments.get({ paymentId: checkout.molliePaymentId! });
    assertMolliePayment(payment, checkout);
    if (paymentNeedsReview(payment)) {
      await prisma.paymentCheckout.update({ where: { id }, data: {
        mollieReviewReason: "Payment has a refund or chargeback; review in Mollie before further fulfilment.", mollieNextAttemptAt: null,
      } });
      console.warn("[mollie] payment requires review", { checkoutId: id });
      return;
    }
    if (payment.status !== "paid") {
      const status = payment.status === "expired" ? "EXPIRED" :
        ["failed", "canceled"].includes(payment.status) ? "FAILED" : null;
      if (status) await prisma.paymentCheckout.updateMany({ where: { id, status: { not: "PAID" } }, data: { status } });
      await prisma.paymentCheckout.update({ where: { id }, data: {
        mollieNextAttemptAt: status ? null : new Date(Date.now() + 60_000),
      } });
      return;
    }
    if (checkout.mollieFulfilledAt) {
      await prisma.paymentCheckout.update({ where: { id }, data: { mollieNextAttemptAt: null } });
      return;
    }
    if (!["UK", "International", "Learner"].includes(checkout.licenceType)) throw new Error("Invalid stored licence");
    const policy = await finalizePolicy({
      vrm: checkout.vrm, make: checkout.make, model: checkout.model, year: checkout.year,
      startAt: checkout.startAt.toISOString(), endAt: checkout.endAt.toISOString(),
      durationMs: Number(checkout.durationMs), totalAmountPence: checkout.totalAmountPence,
      fullName: checkout.fullName, dob: checkout.dob.toISOString(), email: checkout.email,
      licenceType: checkout.licenceType as "UK" | "International" | "Learner", address: checkout.address,
      paymentProvider: "MOLLIE", paymentId: payment.id, paymentStatus: "PAID", currency: checkout.currency,
    });
    await prisma.paymentCheckout.update({ where: { id }, data: { status: "PAID", policyId: policy.policyId } });
    await fulfillPolicy(policy.policyId, { durableEmail: true });
    await prisma.paymentCheckout.update({ where: { id }, data: {
      mollieFulfilledAt: new Date(), mollieNextAttemptAt: null, mollieReviewReason: null,
    } });
  } catch {
    // Persisted checkout remains due for the cron worker. Never log SDK objects/keys/PII.
    console.error("[mollie] reconciliation needs retry", { checkoutId: id });
    throw new Error("Mollie reconciliation needs retry");
  } finally {
    await prisma.paymentCheckout.updateMany({ where: { id, mollieProcessingUntil: lease }, data: { mollieProcessingUntil: null } });
  }
}

export async function drainMollieCheckouts() {
  const config = getMollieConfig();
  const now = new Date();
  const rows = await prisma.paymentCheckout.findMany({ where: {
    paymentProvider: "MOLLIE", mollieMode: config.mode, mollieNextAttemptAt: { lte: now },
    OR: [{ mollieProcessingUntil: null }, { mollieProcessingUntil: { lte: now } }],
  }, orderBy: { mollieNextAttemptAt: "asc" }, take: 4, select: { id: true } });
  // A failed checkout must not prevent other paid purchases from progressing.
  await Promise.allSettled(rows.map(row => reconcileMollieCheckout(row.id)));
}
