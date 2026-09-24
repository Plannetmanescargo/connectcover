import type { PaymentCheckout } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { finalizePolicy } from "@/lib/policy/finalize";
import { fulfillPolicy } from "@/lib/policy/fulfill";
import { getStripe, getStripeConfig } from "./config";
import { assertStripeSession, STRIPE_FLOW, verifiedStripePayment } from "./payment";

export async function ensureStripeSession(checkout: PaymentCheckout) {
  const c = getStripeConfig();
  if (checkout.paymentProvider !== "STRIPE" || checkout.brand !== "coverza" || checkout.stripeLivemode !== c.livemode ||
      checkout.stripeConfigHash !== c.fingerprint) throw new Error("Stripe checkout configuration mismatch");
  if (checkout.stripeCheckoutSessionId) return checkout;
  // Never recreate an ambiguous session after Stripe's minimum 24h key retention.
  if (Date.now() - checkout.createdAt.getTime() > 22 * 3600_000) {
    await prisma.paymentCheckout.update({ where: { id: checkout.id }, data: {
      stripeReviewReason: "Unresolved session creation. Check Stripe before retrying.", stripeNextAttemptAt: null,
    } });
    throw new Error("Stripe session creation needs review");
  }
  const metadata = { brand: "coverza", flow: STRIPE_FLOW, checkoutId: checkout.id };
  const session = await getStripe().checkout.sessions.create({
    mode: "payment", payment_method_types: ["card"], locale: "en-GB", adaptive_pricing: { enabled: false },
    customer_email: checkout.email, client_reference_id: checkout.id, metadata, payment_intent_data: { metadata },
    line_items: [{ quantity: 1, price_data: { currency: "gbp", unit_amount: checkout.totalAmountPence,
      product_data: { name: "Coverza Vehicle Documents" } } }],
    expires_at: Math.floor(checkout.createdAt.getTime() / 1000) + 23 * 3600,
    success_url: `${c.origin}/checkout/success?provider=stripe&checkout_id=${encodeURIComponent(checkout.id)}`,
    cancel_url: `${c.origin}/checkout/cancel`,
  }, { idempotencyKey: `coverza-checkout/${checkout.id}` });
  assertStripeSession(session, checkout);
  if (!session.url || new URL(session.url).protocol !== "https:") throw new Error("Stripe session URL unavailable");
  const linked = await prisma.paymentCheckout.updateMany({ where: {
    id: checkout.id, OR: [{ stripeCheckoutSessionId: null }, { stripeCheckoutSessionId: session.id }],
  }, data: { stripeCheckoutSessionId: session.id, stripeCheckoutUrl: session.url } });
  if (!linked.count) throw new Error("Stripe session link conflict");
  return prisma.paymentCheckout.findUniqueOrThrow({ where: { id: checkout.id } });
}

export async function reconcileStripeCheckout(id: string, immediate = false) {
  const c = getStripeConfig(); const now = new Date(); const lease = new Date(now.getTime() + 120_000);
  const claim = await prisma.paymentCheckout.updateMany({ where: {
    id, brand: "coverza", paymentProvider: "STRIPE", stripeConfigHash: c.fingerprint, stripeLivemode: c.livemode,
    stripeReviewReason: null, ...(immediate ? {} : { stripeNextAttemptAt: { lte: now } }),
    OR: [{ stripeProcessingUntil: null }, { stripeProcessingUntil: { lte: now } }],
  }, data: { stripeProcessingUntil: lease, stripeNextAttemptAt: new Date(now.getTime() + 60_000) } });
  if (!claim.count) return;
  let stage = "session";
  try {
    let checkout = await prisma.paymentCheckout.findUniqueOrThrow({ where: { id } });
    checkout = await ensureStripeSession(checkout);
    const session = await getStripe().checkout.sessions.retrieve(checkout.stripeCheckoutSessionId!, {
      expand: ["payment_intent.latest_charge"],
    });
    stage = "verification";
    assertStripeSession(session, checkout);
    const intent = verifiedStripePayment(session, checkout);
    if (!intent) {
      if (session.status === "expired") await prisma.paymentCheckout.updateMany({
        where: { id, status: { not: "PAID" } }, data: { status: "EXPIRED", stripeNextAttemptAt: null },
      });
      else await prisma.paymentCheckout.update({ where: { id }, data: { stripeNextAttemptAt: new Date(Date.now() + 5_000) } });
      return;
    }
    const charge = typeof intent.latest_charge === "object" ? intent.latest_charge : null;
    if (!charge || charge.amount_refunded > 0 || charge.refunded || charge.disputed) {
      await prisma.paymentCheckout.update({ where: { id }, data: {
        stripeReviewReason: "Charge unavailable, refunded or disputed. Check Stripe.", stripeNextAttemptAt: null,
      } });
      return;
    }
    await prisma.paymentCheckout.update({ where: { id }, data: { stripePaymentIntentId: intent.id } });
    const latest = await prisma.paymentCheckout.findUniqueOrThrow({ where: { id } });
    if (latest.stripeReviewReason) return;
    if (latest.stripeFulfilledAt) {
      await prisma.paymentCheckout.update({ where: { id }, data: { stripeNextAttemptAt: null } }); return;
    }
    if (!["UK", "International", "Learner"].includes(checkout.licenceType)) throw new Error("Invalid licence");
    stage = "finalization";
    const policy = await finalizePolicy({
      vrm: checkout.vrm, make: checkout.make, model: checkout.model, year: checkout.year,
      startAt: checkout.startAt.toISOString(), endAt: checkout.endAt.toISOString(), durationMs: Number(checkout.durationMs),
      totalAmountPence: checkout.totalAmountPence, fullName: checkout.fullName, dob: checkout.dob.toISOString(),
      email: checkout.email, licenceType: checkout.licenceType as "UK" | "International" | "Learner", address: checkout.address,
      paymentProvider: "STRIPE", paymentId: session.id, stripePaymentIntentId: intent.id, paymentStatus: "PAID", currency: "GBP",
    });
    await prisma.paymentCheckout.update({ where: { id }, data: { status: "PAID", policyId: policy.policyId } });
    stage = "delivery";
    await fulfillPolicy(policy.policyId, { durableEmail: true, onDeliveryReady: async () => {
      await prisma.paymentCheckout.update({ where: { id }, data: { stripeFulfilledAt: new Date() } });
      console.info("[stripe] documents and email ready", { checkoutId: id });
    } });
    await prisma.paymentCheckout.update({ where: { id }, data: { stripeFulfilledAt: new Date(), stripeNextAttemptAt: null } });
  } catch {
    console.error("[stripe] reconciliation needs retry", { checkoutId: id, stage });
    throw new Error("Stripe reconciliation needs retry");
  } finally {
    await prisma.paymentCheckout.updateMany({ where: { id, stripeProcessingUntil: lease }, data: { stripeProcessingUntil: null } });
  }
}
export async function drainStripeCheckouts() {
  const c = getStripeConfig(); const now = new Date();
  const rows = await prisma.paymentCheckout.findMany({ where: {
    brand: "coverza", paymentProvider: "STRIPE", stripeConfigHash: c.fingerprint, stripeLivemode: c.livemode,
    stripeReviewReason: null, stripeNextAttemptAt: { lte: now },
    OR: [{ stripeProcessingUntil: null }, { stripeProcessingUntil: { lte: now } }],
  }, orderBy: { stripeNextAttemptAt: "asc" }, take: 4, select: { id: true } });
  await Promise.allSettled(rows.map(row => reconcileStripeCheckout(row.id)));
}
