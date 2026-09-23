import { randomUUID, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { validateCheckout } from "@/lib/payments/checkout";
import { getMollieConfig } from "@/lib/mollie/config";
import { mollieDiagnostic } from "@/lib/mollie/diagnostics";
import { ensureMolliePayment } from "@/lib/mollie/process";

export const runtime = "nodejs";
export const maxDuration = 60;
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  let config: ReturnType<typeof getMollieConfig>;
  try {
    if (process.env.MOLLIE_ENABLED !== "true") throw new Error("Disabled");
    config = getMollieConfig();
  } catch { return reply({ error: "Payment service is not configured yet." }, 503); }
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    return reply({ error: "Please start checkout from our website." }, 403);
  }
  const key = request.headers.get("idempotency-key") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
    return reply({ error: "Please refresh the quote page and try again." }, 400);
  }
  let quote: ReturnType<typeof validateCheckout>;
  try {
    const text = await request.text();
    if (text.length > 16_384) throw new Error("Checkout request is too large.");
    quote = validateCheckout(JSON.parse(text));
  } catch (error) { return reply({ error: error instanceof Error ? error.message : "Invalid checkout request." }, 400); }
  const reference = randomUUID();
  let stage = "save_checkout";
  try {
    const hash = createHash("sha256").update(JSON.stringify(quote, (_, value) => typeof value === "bigint" ? value.toString() : value)).digest("hex");
    const checkout = await prisma.paymentCheckout.upsert({
      where: { mollieRequestKey: `${config.mode}:${key}` }, update: {},
      create: { ...quote, brand: "coverza", paymentProvider: "MOLLIE", currency: "GBP",
        mollieMode: config.mode, mollieConfigHash: config.fingerprint, mollieRequestKey: `${config.mode}:${key}`, mollieRequestHash: hash,
        mollieNextAttemptAt: new Date(Date.now() + 60_000),
      },
    });
    if (checkout.mollieRequestHash !== hash) return reply({ error: "Your quote changed. Refresh and try again." }, 409);
    if (checkout.status === "PAID") return reply({ url: `${config.origin}/checkout/success?provider=mollie&checkout_id=${encodeURIComponent(checkout.id)}` });
    if (checkout.status !== "PENDING") return reply({ error: "This payment has ended. Refresh your quote before trying again." }, 409);
    const ready = await ensureMolliePayment(checkout, value => { stage = value; });
    return reply({ url: ready.mollieCheckoutUrl, provider: "mollie", checkoutId: ready.id });
  } catch (error) {
    console.error("[mollie checkout] creation failed", { reference, stage, ...mollieDiagnostic(error) });
    return reply({ error: `We could not open the payment page. Please try again. Reference: ${reference}`, reference }, 502);
  }
}
