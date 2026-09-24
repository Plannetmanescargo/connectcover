import { createHash } from "node:crypto";
import Stripe from "stripe";

export function getStripeConfig(env: Record<string, string | undefined> = process.env) {
  const secretKey = env.STRIPE_SECRET_KEY?.trim() || "";
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim() || "";
  if (!/^(sk|rk)_(test|live)_[A-Za-z0-9]+$/.test(secretKey) || !webhookSecret.startsWith("whsec_")) {
    throw new Error("Stripe secret key and webhook secret are required");
  }
  const url = new URL(env.NEXT_PUBLIC_BASE_URL || "");
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Public HTTPS origin required");
  }
  return { secretKey, webhookSecret, origin: url.origin, livemode: /^(sk|rk)_live_/.test(secretKey),
    fingerprint: createHash("sha256").update(secretKey).digest("hex") };
}
export function getStripe() {
  return new Stripe(getStripeConfig().secretKey, { apiVersion: "2025-12-15.clover", maxNetworkRetries: 1, timeout: 10_000 });
}
