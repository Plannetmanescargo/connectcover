import type Stripe from "stripe";
import type { PaymentCheckout } from "@prisma/client";

export const STRIPE_FLOW = "coverza-vehicle-documents-v1";
export function assertStripeSession(session: Stripe.Checkout.Session, checkout: PaymentCheckout) {
  if (checkout.brand !== "coverza" || checkout.paymentProvider !== "STRIPE" || session.mode !== "payment" ||
      session.livemode !== checkout.stripeLivemode || session.client_reference_id !== checkout.id ||
      session.metadata?.checkoutId !== checkout.id || session.metadata?.brand !== "coverza" || session.metadata?.flow !== STRIPE_FLOW ||
      (checkout.stripeCheckoutSessionId && checkout.stripeCheckoutSessionId !== session.id) ||
      checkout.currency !== "GBP" || session.currency !== "gbp" || session.amount_total !== checkout.totalAmountPence ||
      session.amount_subtotal !== checkout.totalAmountPence || !session.id.startsWith("cs_")) {
    throw new Error("Stripe session identity or amount mismatch");
  }
}
export function verifiedStripePayment(session: Stripe.Checkout.Session, checkout: PaymentCheckout) {
  assertStripeSession(session, checkout);
  if (session.status !== "complete" || session.payment_status !== "paid") return null;
  const intent = typeof session.payment_intent === "object" ? session.payment_intent : null;
  if (!intent || intent.status !== "succeeded" || intent.amount_received !== checkout.totalAmountPence ||
      intent.currency !== "gbp" || intent.livemode !== checkout.stripeLivemode ||
      intent.metadata.checkoutId !== checkout.id || intent.metadata.brand !== "coverza" || intent.metadata.flow !== STRIPE_FLOW ||
      (checkout.stripePaymentIntentId && checkout.stripePaymentIntentId !== intent.id)) {
    throw new Error("Stripe PaymentIntent is not the expected completed payment");
  }
  return intent;
}
