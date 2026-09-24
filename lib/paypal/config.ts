import { createHash } from "node:crypto";
export function getPayPalConfig(env: Record<string, string | undefined> = process.env) {
  const mode = env.PAYPAL_ENVIRONMENT?.trim() || "sandbox";
  const clientId = env.PAYPAL_CLIENT_ID?.trim() || "";
  const secret = env.PAYPAL_CLIENT_SECRET?.trim() || "";
  const merchantId = env.PAYPAL_MERCHANT_ID?.trim() || "";
  const webhookId = env.PAYPAL_WEBHOOK_ID?.trim() || "";
  if (!["sandbox", "live"].includes(mode) || !clientId || !secret || !merchantId || !webhookId) throw new Error("PayPal configuration is incomplete");
  const url = new URL(env.NEXT_PUBLIC_BASE_URL || "");
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/" ||
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw new Error("Public HTTPS origin required");
  return { mode, clientId, secret, merchantId, webhookId, origin: url.origin,
    api: mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com",
    fingerprint: createHash("sha256").update(`${mode}:${clientId}:${merchantId}`).digest("hex"),
    applePay: env.PAYPAL_APPLE_PAY_ENABLED === "true", googlePay: env.PAYPAL_GOOGLE_PAY_ENABLED === "true" };
}
