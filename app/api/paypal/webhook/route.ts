import { after, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { captureIdFromLinks } from "@/lib/paypal/payment";
import { verifyPayPalWebhook } from "@/lib/paypal/webhook";
import { getPayPalConfig } from "@/lib/paypal/config";
import { paypalIdValid } from "@/lib/paypal/payment";
import { reconcilePayPalCheckout } from "@/lib/paypal/process";
export const runtime = "nodejs";
export const maxDuration = 60;
const events = new Set(["CHECKOUT.ORDER.APPROVED", "CHECKOUT.PAYMENT-APPROVAL.REVERSED", "PAYMENT.CAPTURE.COMPLETED", "PAYMENT.CAPTURE.PENDING", "PAYMENT.CAPTURE.DENIED", "PAYMENT.CAPTURE.REFUNDED", "PAYMENT.CAPTURE.REVERSED", "CUSTOMER.DISPUTE.CREATED"]);
type Event = { id: string; event_type: string; resource: { id?: string; links?: Array<{ rel?: string; href?: string }>; supplementary_data?: { related_ids?: { order_id?: string; capture_id?: string } }; disputed_transactions?: Array<{ seller_transaction_id?: string }> } };
export async function POST(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return new NextResponse("Expected JSON", { status: 415 });
  let event: Event;
  try {
    const raw = await request.text(); if (raw.length > 262144) throw new Error();
    event = JSON.parse(raw); if (!event.id || typeof event.event_type !== "string" || !event.resource) throw new Error();
  } catch { return new NextResponse("Invalid event", { status: 400 }); }
  try {
    if (!await verifyPayPalWebhook(request.headers, event)) return new NextResponse("Invalid signature", { status: 401 });
    if (!events.has(event.event_type)) return new NextResponse("OK");
    const c = getPayPalConfig(); const related = event.resource.supplementary_data?.related_ids;
    const orderId = event.event_type.startsWith("CHECKOUT.") ? event.resource.id : related?.order_id;
    const captureIds = [related?.capture_id, captureIdFromLinks(event.resource.links, c.api), ...(event.event_type.startsWith("PAYMENT.CAPTURE.") && event.event_type !== "PAYMENT.CAPTURE.REFUNDED" ? [event.resource.id] : []),
      ...(event.resource.disputed_transactions || []).map(t => t.seller_transaction_id)].filter(paypalIdValid);
    const OR = [...(paypalIdValid(orderId) ? [{ paypalOrderId: orderId }] : []), ...captureIds.map(id => ({ paypalCaptureId: id }))];
    if (!OR.length) return new NextResponse("Unresolved event", { status: 503 });
    const rows = await prisma.paymentCheckout.findMany({ where: { paymentProvider: "PAYPAL", paypalMode: c.mode, paypalMerchantId: c.merchantId, OR }, select: { id: true } });
    // Retry create/save and capture/save races rather than dropping a refund.
    if (!rows.length) return new NextResponse("Checkout not yet available", { status: 503 });
    for (const row of rows) {
      const review = /REFUNDED|REVERSED|DISPUTE/.test(event.event_type);
      await prisma.paymentCheckout.update({ where: { id: row.id }, data: review ? {
        paypalReviewReason: `${event.event_type}: review in PayPal before further fulfilment.`, paypalNextAttemptAt: null,
      } : { paypalNextAttemptAt: new Date() } });
      if (!review) after(async () => { try { await reconcilePayPalCheckout(row.id); } catch { /* durable retry */ } });
    }
    return new NextResponse("OK");
  } catch { return new NextResponse("Retry later", { status: 503 }); }
}
