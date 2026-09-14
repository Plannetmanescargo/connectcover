import { NextResponse } from "next/server";
import { fetchRapidCarCheck, normaliseRegistration, VehicleLookupError, type VehicleSummary } from "@/lib/vehicle/rapidCarCheck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Best-effort burst protection and in-flight deduplication per server instance.
// These are not a distributed quota: the provider owns the monthly allowance.
const bursts = new Map<string, { count: number; until: number }>();
const pending = new Map<string, Promise<VehicleSummary>>();

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin");
    if ((origin && origin !== new URL(req.url).origin) || req.headers.get("sec-fetch-site") === "cross-site") {
      return json({ ok: false, error: "Please use the vehicle lookup on our website." }, 403);
    }
    const text = await req.text();
    if (text.length > 256) return json({ ok: false, error: "Invalid vehicle lookup request." }, 400);
    let body;
    try { body = JSON.parse(text); } catch { return json({ ok: false, error: "Invalid vehicle lookup request." }, 400); }
    const vrm = normaliseRegistration(body?.vrm);
    if (!vrm) return json({ ok: false, error: "Please enter a valid registration number." }, 400);

    const now = Date.now();
    for (const [key, value] of bursts) if (value.until <= now) bursts.delete(key);
    // Vercel supplies this header; do not trust arbitrary forwarded IPs elsewhere.
    const ip = process.env.VERCEL ? req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() : null;
    const client = ip || "local";
    const burst = bursts.get(client) || { count: 0, until: now + 60_000 };
    if (burst.count >= 10 || (!bursts.has(client) && bursts.size >= 10_000)) {
      return json({ ok: false, error: "Too many searches. Wait a minute or enter the vehicle details manually." }, 429);
    }
    burst.count += 1;
    bursts.set(client, burst);

    let lookup = pending.get(vrm);
    if (!lookup) {
      lookup = fetchRapidCarCheck(vrm).finally(() => pending.delete(vrm));
      pending.set(vrm, lookup);
    }
    const summary = await lookup;
    return json({ ok: true, vrm, summary });
  } catch (error) {
    if (error instanceof VehicleLookupError) return json({ ok: false, error: error.message }, error.status);
    return json({ ok: false, error: "Vehicle lookup is temporarily unavailable. Please enter the details manually." }, 503);
  }
}
