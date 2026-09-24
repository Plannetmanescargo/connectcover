import { NextResponse } from "next/server";
import { activePaymentProvider } from "@/lib/payments/provider";
import { POST as mollie } from "@/app/api/mollie/checkout/route";
import { POST as paypal } from "@/app/api/paypal/checkout/route";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try { return activePaymentProvider() === "paypal" ? paypal(request) : mollie(request); }
  catch { return NextResponse.json({ error: "Payment service is unavailable." }, { status: 503 }); }
}
