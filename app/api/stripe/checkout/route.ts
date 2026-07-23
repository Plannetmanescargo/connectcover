import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CheckoutRequestBody = {
  quote: {
    vrm: string;
    make?: string | null;
    model?: string | null;
    year?: string | null;
    startAt: string; // ISO
    endAt: string; // ISO
    durationMs: number;
    totalAmountPence: number;
  };
  customer: {
    fullName: string;
    dob: string; // ISO date
    email: string;
    licenceType: "UK" | "International" | "Learner";
    address: string;
  };
};

function getOrigin(req: Request) {
  // Prefer explicit env var (works in prod + preview + local)
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;

  // Fallbacks for local/dev
  const hdrOrigin = req.headers.get("origin");
  if (hdrOrigin) return hdrOrigin;

  const url = new URL(req.url);
  const host = req.headers.get("host") ?? url.host;
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-12-15.clover" });

    const body = (await req.json()) as CheckoutRequestBody;

    // Lightweight guards
    if (!body?.customer?.email) {
      return NextResponse.json({ error: "Missing customer.email" }, { status: 400 });
    }
    if (!body?.quote?.vrm) {
      return NextResponse.json({ error: "Missing quote.vrm" }, { status: 400 });
    }
    if (!Number.isInteger(body?.quote?.totalAmountPence) || body.quote.totalAmountPence <= 0) {
      return NextResponse.json({ error: "Invalid quote.totalAmountPence" }, { status: 400 });
    }

    const origin = getOrigin(req);

    // Stripe metadata values MUST be strings.
    const metadata: Record<string, string> = {
      brand: "coverza",
      vrm: body.quote.vrm,
      make: body.quote.make ?? "",
      model: body.quote.model ?? "",
      year: body.quote.year ?? "",
      startAt: body.quote.startAt,
      endAt: body.quote.endAt,
      durationMs: String(body.quote.durationMs),
      totalAmountPence: String(body.quote.totalAmountPence),

      fullName: body.customer.fullName,
      dob: body.customer.dob,
      email: body.customer.email,
      licenceType: body.customer.licenceType,
      address: body.customer.address,
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.customer.email,

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: body.quote.totalAmountPence, // number in pence ✅
            product_data: { name: "Coverza Temporary Insurance Policy" },
          },
        },
      ],

    allow_promotion_codes: true,
    
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,

      metadata,
    });

    // ✅ IMPORTANT: use the exact URL Stripe returns (includes required fragment bits)
    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a Checkout URL" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to create checkout session" }, { status: 500 });
  }
}
