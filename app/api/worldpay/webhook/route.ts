import { NextResponse } from "next/server";
import { getWorldpayEnvironment, getWorldpayWebhookKeys } from "@/lib/worldpay/config";
import { verifyWorldpaySignature } from "@/lib/worldpay/signature";
import { parseWorldpayEvent } from "@/lib/worldpay/events";
import { processWorldpayEvent } from "@/lib/worldpay/process-event";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let keys: Record<string, string>; let environment: string;
  try { keys = getWorldpayWebhookKeys(); environment = getWorldpayEnvironment(); } catch {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }
  const raw = Buffer.from(await request.arrayBuffer());
  if (!verifyWorldpaySignature(raw, request.headers.get("Event-Signature"), keys)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }
  let event: ReturnType<typeof parseWorldpayEvent>;
  try { event = parseWorldpayEvent(JSON.parse(raw.toString("utf8"))); } catch {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }
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
