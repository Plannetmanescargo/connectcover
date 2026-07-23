// app/api/stripe/webhook/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { finalizePolicy } from "@/lib/policy/finalize";
import { fulfillPolicy } from "@/lib/policy/fulfill";

export const runtime = "nodejs";

// Tighten licenceType to your allowed set, fallback to UK
function coerceLicenceType(v: unknown): "UK" | "International" | "Learner" {
  const s = String(v ?? "").trim();

  if (s === "International") return "International";
  if (s === "Learner") return "Learner";

  return "UK";
}

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "Missing STRIPE_SECRET_KEY" },
      { status: 500 }
    );
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-12-15.clover",
  });

  // Stripe signature verification requires the raw body
  const rawBody = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    // If signature verification fails, do not ACK.
    // Stripe should treat this as failed.
    return NextResponse.json(
      {
        error: `Webhook signature verification failed: ${
          err?.message ?? String(err)
        }`,
      },
      { status: 400 }
    );
  }

  // From here onward, ACK Stripe to prevent retry storms.
  try {
    console.log("[stripe webhook]", event.type);

    const isCheckoutSuccess =
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded";

    const isCheckoutFailed =
      event.type === "checkout.session.async_payment_failed";

    if (isCheckoutFailed) {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("[stripe webhook] async payment failed", {
        id: session.id,
        payment_status: session.payment_status,
        customer_email: session.customer_email,
      });

      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (!isCheckoutSuccess) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    console.log("[stripe webhook] session", {
      id: session.id,
      payment_status: session.payment_status,
      currency: session.currency,
      customer_email: session.customer_email,
    });

    const md = session.metadata || {};

    // IMPORTANT:
    // This prevents Coverza from fulfilling TempCover payments
    // when both brands share the same Stripe account/webhooks.
    if (md.brand !== "coverza") {
      console.log("[stripe webhook] ignored non-coverza checkout session", {
        sessionId: session.id,
        brand: md.brand ?? null,
      });

      return NextResponse.json(
        {
          received: true,
          ignored: true,
          reason: "wrong_brand",
        },
        { status: 200 }
      );
    }

    // Only finalize when paid
    if (session.payment_status !== "paid") {
      console.log("[stripe webhook] ignoring unpaid session", {
        id: session.id,
        payment_status: session.payment_status,
      });

      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (!md.vrm || !md.startAt || !md.endAt || !(md.email || session.customer_email)) {
      console.error("[stripe webhook] missing required metadata", {
        id: session.id,
        metadataKeys: Object.keys(md),
        customer_email: session.customer_email,
      });

      // Still ACK so Stripe does not retry forever.
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 1) Finalize policy in DB
    const result = await finalizePolicy({
      // quote
      vrm: md.vrm || "",
      make: md.make || null,
      model: md.model || null,
      year: md.year || null,
      startAt: md.startAt || "",
      endAt: md.endAt || "",
      durationMs: Number(md.durationMs || 0),
      totalAmountPence: Number(md.totalAmountPence || 0),

      // customer
      fullName: md.fullName || "",
      dob: md.dob || "",
      email: md.email || session.customer_email || "",
      licenceType: coerceLicenceType(md.licenceType),
      address: md.address || "",

      // payment
      paymentProvider: "STRIPE",
      paymentId: session.id,
      paymentStatus: "PAID",
      currency: (session.currency || "gbp").toUpperCase(),

      // Stripe extra
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
    });

    console.log("[finalize] ok", {
      policyId: result.policyId,
      policyNumber: result.policyNumber,
    });

    // 2) Generate docs, upload docs, and send email
    try {
      const fulfilled = await fulfillPolicy(result.policyId);

      console.log("[fulfill] ok", fulfilled.policyNumber);
    } catch (e: any) {
      console.error(
        "[fulfill] failed, acknowledging to Stripe",
        e?.message ?? e
      );
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e: any) {
    console.error("[stripe webhook] handler error, acknowledging to prevent retries", e);

    return NextResponse.json({ received: true }, { status: 200 });
  }
}