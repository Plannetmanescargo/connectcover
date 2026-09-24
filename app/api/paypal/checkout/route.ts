import { activePaymentProvider } from "@/lib/payments/provider";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { validateCheckout } from "@/lib/payments/checkout";
import { getPayPalConfig } from "@/lib/paypal/config";
import { ensurePayPalOrder } from "@/lib/paypal/process";

export const runtime = "nodejs";
export const maxDuration = 60;
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  let config: ReturnType<typeof getPayPalConfig>;
  try {
    if (activePaymentProvider() !== "paypal" || process.env.PAYPAL_ENABLED !== "true") throw new Error("Disabled");
    config = getPayPalConfig();
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
  try {
    const hash = createHash("sha256").update(JSON.stringify(quote, (_, value) => typeof value === "bigint" ? value.toString() : value)).digest("hex");
    const checkout = await prisma.paymentCheckout.upsert({
      where: { paypalRequestKey: `${config.mode}:${key}` }, update: {},
      create: { ...quote, brand: "coverza", paymentProvider: "PAYPAL", currency: "GBP",
        paypalMerchantId: config.merchantId, paypalMode: config.mode, paypalConfigHash: config.fingerprint, paypalRequestKey: `${config.mode}:${key}`, paypalRequestHash: hash,
        paypalNextAttemptAt: new Date(Date.now() + 60_000),
      },
    });
    if (checkout.paypalRequestHash !== hash) return reply({ error: "Your quote changed. Refresh and try again." }, 409);
    if (checkout.status === "PAID") return reply({ url: `${config.origin}/checkout/success?provider=paypal&checkout_id=${encodeURIComponent(checkout.id)}` });
    if (checkout.status !== "PENDING") return reply({ error: "This payment has ended. Refresh your quote before trying again." }, 409);
    const ready = await ensurePayPalOrder(checkout);
    return reply({ url: `${config.origin}/checkout/paypal?checkout_id=${encodeURIComponent(ready.id)}`, provider: "paypal", checkoutId: ready.id });
  } catch {
    console.error("[paypal checkout] creation failed; retry with the same attempt key");
    return reply({ error: "We could not open the payment page. Please try again." }, 502);
  }
}
