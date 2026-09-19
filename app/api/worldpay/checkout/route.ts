import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { getWorldpayConfig } from "@/lib/worldpay/config";
import { validateWorldpayCheckout } from "@/lib/worldpay/checkout";

export const runtime = "nodejs";
const mediaType = "application/vnd.worldpay.payment_pages-v1.hal+json";

export async function POST(request: Request) {
  let config: ReturnType<typeof getWorldpayConfig>;
  try { config = getWorldpayConfig(); } catch {
    console.error("[worldpay checkout] missing or invalid configuration");
    return NextResponse.json({ error: "Payment service is not configured yet." }, { status: 503 });
  }
  let quote: ReturnType<typeof validateWorldpayCheckout>;
  try { quote = validateWorldpayCheckout(await request.json()); } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid checkout request." }, { status: 400 });
  }
  let checkoutId: string | undefined;
  try {
    const transactionReference = `wp_${config.environment}_${randomUUID()}`;
    const checkout = await prisma.paymentCheckout.create({ data: {
      ...quote, brand: "coverza", status: "PENDING", paymentProvider: "WORLDPAY", currency: "GBP",
      worldpayTransactionReference: transactionReference,
      worldpayEntity: config.entity, worldpayEnvironment: config.environment,
    } });
    checkoutId = checkout.id;
    const success = `${config.origin}/checkout/success?provider=worldpay&checkout_id=${encodeURIComponent(checkout.id)}`;
    const result = `${config.origin}/checkout/worldpay?checkout_id=${encodeURIComponent(checkout.id)}`;
    const response = await fetch(config.endpoint, {
      method: "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
      headers: { Authorization: config.authorization, "Content-Type": mediaType, Accept: mediaType },
      body: JSON.stringify({ transactionReference,
        merchant: { entity: config.entity }, narrative: { line1: config.narrative },
        value: { currency: "GBP", amount: quote.totalAmountPence },
        description: "Car Solutions",
        settlement: { auto: true },
        riskData: { account: { type: "guestUser", email: quote.email } },
        resultURLs: { successURL: success, pendingURL: success,
          failureURL: `${result}&result=failed`, errorURL: `${result}&result=error`,
          cancelURL: `${result}&result=cancelled`, expiryURL: `${result}&result=expired` },
      }),
    });
    if (!response.ok) {
      // A definitive rejection is different from an ambiguous timeout/5xx.
      if (response.status >= 400 && response.status < 500) {
        await prisma.paymentCheckout.updateMany({ where: { id: checkout.id, status: "PENDING" }, data: { status: "FAILED" } });
      }
      console.error("[worldpay checkout] setup rejected", { checkoutId, status: response.status });
      return NextResponse.json({ error: "We could not open the payment page. Please try again." }, { status: 502 });
    }
    const data: unknown = await response.json();
    const url = data && typeof data === "object" && "url" in data ? data.url : null;
    if (typeof url !== "string" || new URL(url).protocol !== "https:") throw new Error("Invalid HPP URL");
    // Worldpay explicitly uses multiple hosted domains: no brittle hostname allowlist.
    return NextResponse.json({ url, provider: "worldpay", checkoutId });
  } catch {
    // Keep ambiguous setups recoverable: an authenticated webhook remains authoritative.
    console.error("[worldpay checkout] setup failed", { checkoutId });
    return NextResponse.json({ error: "We could not start the payment. Please try again." }, { status: 502 });
  }
}
