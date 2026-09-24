import type Stripe from "stripe";
import { after, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { getStripe, getStripeConfig } from "@/lib/stripe/config";
import { assertStripeSession, STRIPE_FLOW } from "@/lib/stripe/payment";
import { reconcileStripeCheckout } from "@/lib/stripe/process";
import { POST as legacySquareWebhook } from "@/lib/payments/square-webhook";

export const runtime = "nodejs";
export const maxDuration = 60;
const EVENTS = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed", "checkout.session.expired"]);
export async function POST(request: Request) {
  // Preserve signed callbacks for historical Square purchases on this old URL.
  if (!request.headers.has("stripe-signature") && request.headers.has("x-square-hmacsha256-signature")) return legacySquareWebhook(request);
  let config: ReturnType<typeof getStripeConfig>;
  let stripe: ReturnType<typeof getStripe>;
  try { config = getStripeConfig(); stripe = getStripe(); }
  catch { return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 }); }
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(await request.text(), request.headers.get("stripe-signature") || "", config.webhookSecret); }
  catch { return NextResponse.json({ error: "Invalid signature" }, { status: 400 }); }
  if (event.livemode !== config.livemode) return NextResponse.json({ error: "Mode mismatch" }, { status: 400 });
  try {
    if (event.type === "charge.refunded" || event.type === "charge.dispute.created") {
      const object = event.data.object as Stripe.Charge | Stripe.Dispute;
      const intentId = typeof object.payment_intent === "string" ? object.payment_intent : object.payment_intent?.id;
      if (intentId) await prisma.paymentCheckout.updateMany({ where: {
        brand: "coverza", paymentProvider: "STRIPE", stripePaymentIntentId: intentId,
        stripeConfigHash: config.fingerprint, stripeLivemode: config.livemode,
      }, data: { stripeReviewReason: "Refund or dispute requires manual review.", stripeNextAttemptAt: null } });
      return NextResponse.json({ received: true });
    }
    if (!EVENTS.has(event.type)) return NextResponse.json({ received: true, ignored: true });
    const notified = event.data.object as Stripe.Checkout.Session;
    if (notified.metadata?.brand !== "coverza" || notified.metadata?.flow !== STRIPE_FLOW) return NextResponse.json({ received: true, ignored: true });
    const id = notified.metadata.checkoutId;
    if (!id) throw new Error("Missing checkout reference");
    const checkout = await prisma.paymentCheckout.findUnique({ where: { id } });
    if (!checkout || checkout.stripeConfigHash !== config.fingerprint || checkout.stripeLivemode !== config.livemode) throw new Error("Checkout configuration mismatch");
    // Retrieve current state; out-of-order events cannot downgrade a paid order.
    const session = await stripe.checkout.sessions.retrieve(notified.id, { expand: ["payment_intent"] });
    assertStripeSession(session, checkout);
    const linked = await prisma.paymentCheckout.updateMany({ where: {
      id, OR: [{ stripeCheckoutSessionId: null }, { stripeCheckoutSessionId: session.id }],
    }, data: { stripeCheckoutSessionId: session.id, stripeNextAttemptAt: new Date() } });
    if (!linked.count) throw new Error("Session link conflict");
    if (event.type === "checkout.session.async_payment_failed" && session.payment_status === "unpaid" &&
        session.status === "complete" && typeof session.payment_intent === "object" && session.payment_intent &&
        ["requires_payment_method", "canceled"].includes(session.payment_intent.status)) {
      await prisma.paymentCheckout.updateMany({ where: { id, status: { not: "PAID" } }, data: { status: "FAILED", stripeNextAttemptAt: null } });
    } else {
      // Acknowledge only after durable retry work exists. Cron survives termination.
      after(async () => { try { await reconcileStripeCheckout(id, true); } catch { /* cron retries */ } });
    }
    return NextResponse.json({ received: true });
  } catch {
    console.error("[stripe webhook] retry needed", { eventId: event.id, type: event.type });
    return NextResponse.json({ error: "Retry required" }, { status: 500 });
  }
}
