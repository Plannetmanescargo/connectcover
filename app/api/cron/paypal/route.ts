import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { drainPayPalCheckouts } from "@/lib/paypal/process";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  const actual = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.PAYPAL_CLIENT_ID) return NextResponse.json({ configured: false });
  await drainPayPalCheckouts();
  return NextResponse.json({ processed: true }, { headers: { "Cache-Control": "no-store" } });
}
