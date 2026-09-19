import { isIP } from "node:net";

// Worldpay HPP webhook sources, checked 2026-09-19. Update this full list and
// the Vercel WAF rule together if Worldpay changes its published addresses.
// https://docs.worldpay.com/access/products/hosted-payment-pages/webhooks
export const WORLDPAY_WEBHOOK_IPS = [
  "34.246.73.11", "52.215.22.123", "52.31.61.0", "18.130.125.132",
  "35.176.91.145", "52.56.235.128", "18.185.7.67", "18.185.134.117",
  "18.185.158.215", "52.48.6.187", "34.243.65.63", "3.255.13.18",
  "3.251.36.74", "63.32.208.6", "52.19.45.138", "3.11.50.124",
  "3.11.213.43", "3.14.190.43", "3.121.172.32", "3.125.11.252",
  "3.126.98.120", "3.139.153.185", "3.139.255.63", "13.200.51.10",
  "13.200.56.25", "13.232.151.127", "34.236.63.10", "34.253.172.98",
  "35.170.209.108", "35.177.246.6", "52.4.68.25", "52.51.12.88",
  "108.129.30.203",
] as const;

const allowedIPs: ReadonlySet<string> = new Set(WORLDPAY_WEBHOOK_IPS);

export function assertVercelWebhookRuntime(): void {
  // Never trust a client-supplied header on a local/self-hosted Next.js server.
  // VERCEL is a platform system variable, not a request header or user setting.
  if (process.env.VERCEL !== "1" || process.env.NODE_ENV !== "production") {
    throw new Error("Worldpay vercel-ip mode requires a deployed Vercel runtime.");
  }
}

export function isWorldpayVercelSource(headers: Headers): boolean {
  assertVercelWebhookRuntime();
  // Vercel supplies this header at ingress. Do not fall back to Forwarded,
  // X-Forwarded-For, X-Real-IP or CF-Connecting-IP, or pick an IP from a list.
  // https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for
  const supplied = headers.get("x-vercel-forwarded-for")?.trim();
  if (!supplied || !isIP(supplied)) return false;
  const ip = supplied.toLowerCase().startsWith("::ffff:")
    ? supplied.slice(7) : supplied;
  return allowedIPs.has(ip);
}
