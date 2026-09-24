import { after, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { reconcilePayPalCheckout } from "@/lib/paypal/process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
  const id = new URL(request.url).searchParams.get("checkout_id");
  if (!id || !/^[a-zA-Z0-9_-]{10,128}$/.test(id)) return reply({ confirmed: false }, 400);
  try {
    const checkout = await prisma.paymentCheckout.findUnique({ where: { id }, select: {
      paymentProvider: true, brand: true, status: true, policyId: true, paypalFulfilledAt: true, paypalReviewReason: true,
    } });
    if (!checkout || checkout.paymentProvider !== "PAYPAL" || checkout.brand !== "coverza") return reply({ confirmed: false }, 404);
    const confirmed = checkout.status === "PAID" && Boolean(checkout.policyId && checkout.paypalFulfilledAt);
    if (!confirmed && !checkout.paypalReviewReason && checkout.status !== "FAILED" && checkout.status !== "EXPIRED") {
      after(async () => { try { await reconcilePayPalCheckout(id); } catch { /* cron retries */ } });
    }
    return reply({ confirmed, status: checkout.status, needsReview: Boolean(checkout.paypalReviewReason) });
  } catch { return reply({ confirmed: false }, 503); }
}
