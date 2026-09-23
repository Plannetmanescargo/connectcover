import { after, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { paymentIdValid } from "@/lib/mollie/payment";
import { reconcileMollieCheckout } from "@/lib/mollie/process";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  // Classic Payments API webhook: form-encoded ID only. Dashboard next-gen JSON
  // webhooks are a different protocol and are deliberately not accepted here.
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/x-www-form-urlencoded") {
    return new NextResponse("Expected a Payments API webhook", { status: 415 });
  }
  const body = await request.text();
  if (body.length > 512) return new NextResponse("Invalid request", { status: 400 });
  const id = new URLSearchParams(body).get("id");
  if (!paymentIdValid(id)) return new NextResponse("Invalid payment ID", { status: 400 });
  try {
    // Only schedule known checkouts. A webhook never supplies authoritative status.
    // Unknown IDs get 200 as Mollie recommends; cron recovers create/save races.
    const checkout = await prisma.paymentCheckout.findUnique({ where: { molliePaymentId: id }, select: { id: true } });
    if (checkout) {
      await prisma.paymentCheckout.update({ where: { id: checkout.id }, data: { mollieNextAttemptAt: new Date() } });
      after(async () => { try { await reconcileMollieCheckout(checkout.id); } catch { /* durable cron retry */ } });
    }
    // Acknowledge only after the retry work is durably recorded (15s provider limit).
    return new NextResponse("OK", { status: 200 });
  } catch { return new NextResponse("Retry later", { status: 503 }); }
}
