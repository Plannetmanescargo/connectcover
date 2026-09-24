import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { getPayPalConfig } from "@/lib/paypal/config";
import { reconcilePayPalCheckout } from "@/lib/paypal/process";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
  if (request.headers.get("origin") !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site") return reply({ error: "Invalid origin" }, 403);
  let id: string;
  try {
    const raw = await request.text(); if (raw.length > 512) throw new Error();
    id = JSON.parse(raw).checkoutId;
    if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{10,128}$/.test(id)) throw new Error();
  } catch { return reply({ error: "Invalid checkout" }, 400); }
  try {
    const c = getPayPalConfig();
    const row = await prisma.paymentCheckout.findUnique({ where: { id } });
    if (!row || row.paymentProvider !== "PAYPAL" || row.brand !== "coverza" || row.paypalMode !== c.mode || row.paypalConfigHash !== c.fingerprint) return reply({ error: "Unknown checkout" }, 404);
    // Persist recovery before attempting capture; the worker uses only the stored order.
    if (!row.paypalReviewReason) {
      await prisma.paymentCheckout.update({ where: { id }, data: { paypalNextAttemptAt: new Date() } });
      try { await reconcilePayPalCheckout(id, true); } catch { /* cron recovers uncertain captures */ }
    }
    const latest = await prisma.paymentCheckout.findUniqueOrThrow({ where: { id } });
    return reply({ paid: latest.status === "PAID", needsReview: Boolean(latest.paypalReviewReason),
      url: `${c.origin}/checkout/success?provider=paypal&checkout_id=${encodeURIComponent(id)}` });
  } catch { return reply({ error: "We are checking your payment. Please do not pay again." }, 503); }
}
