import { after, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { reconcileMollieCheckout } from "@/lib/mollie/process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
  const id = new URL(request.url).searchParams.get("checkout_id");
  if (!id || !/^[a-zA-Z0-9_-]{10,128}$/.test(id)) return reply({ confirmed: false }, 400);
  try {
    const checkout = await prisma.paymentCheckout.findUnique({ where: { id }, select: {
      paymentProvider: true, brand: true, status: true, policyId: true, mollieFulfilledAt: true, mollieReviewReason: true,
    } });
    if (!checkout || checkout.paymentProvider !== "MOLLIE" || checkout.brand !== "coverza") return reply({ confirmed: false }, 404);
    const confirmed = checkout.status === "PAID" && Boolean(checkout.policyId && checkout.mollieFulfilledAt);
    if (!confirmed && !checkout.mollieReviewReason && checkout.status !== "FAILED" && checkout.status !== "EXPIRED") {
      after(async () => { try { await reconcileMollieCheckout(id); } catch { /* cron retries */ } });
    }
    return reply({ confirmed, status: checkout.status, needsReview: Boolean(checkout.mollieReviewReason) });
  } catch { return reply({ confirmed: false }, 503); }
}
