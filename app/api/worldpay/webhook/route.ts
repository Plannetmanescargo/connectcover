import { NextResponse } from "next/server";
import { getWorldpayEnvironment, getWorldpayWebhookSecurity } from "@/lib/worldpay/config";
import { verifyWorldpaySignature } from "@/lib/worldpay/signature";
import { isWorldpayVercelSource } from "@/lib/worldpay/source-ip";
import { parseWorldpayEvent } from "@/lib/worldpay/events";
import { processWorldpayEvent } from "@/lib/worldpay/process-event";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let security: ReturnType<typeof getWorldpayWebhookSecurity>; let environment: string;
  try { security = getWorldpayWebhookSecurity(); environment = getWorldpayEnvironment(); } catch {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }
  // Reject untrusted sources before reading or parsing any payment data.
  if (security.mode === "vercel-ip" && !isWorldpayVercelSource(request.headers)) {
    return NextResponse.json({ error: "Webhook source not allowed." }, { status: 403 });
  }
  const raw = Buffer.from(await request.arrayBuffer());
  if (security.mode === "hmac" && !verifyWorldpaySignature(raw, request.headers.get("Event-Signature"), security.keys)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }
  let event: ReturnType<typeof parseWorldpayEvent>;
  try { event = parseWorldpayEvent(JSON.parse(raw.toString("utf8"))); } catch {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }
  // WPecom enables its supported events at account level. Token events have
  // a different shape and must not block delivery or create a policy.
  if (!event) return NextResponse.json({ received: true });
  try {
    await processWorldpayEvent(event, environment);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[worldpay webhook] processing failed", {
      eventId: event.eventId, type: event.eventDetails.type,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Payment processing incomplete; retry required." }, { status: 500 });
  }
}
