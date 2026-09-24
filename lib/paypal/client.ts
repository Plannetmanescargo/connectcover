import { getPayPalConfig } from "./config";
let cached: { key: string; token: string; until: number } | undefined;
export class PayPalError extends Error {
  constructor(public status: number) { super("PayPal request failed"); }
}
async function accessToken() {
  const c = getPayPalConfig();
  const key = `${c.fingerprint}:${c.secret}`;
  if (cached?.key === key && cached.until > Date.now()) return cached.token;
  const response = await fetch(`${c.api}/v1/oauth2/token`, { method: "POST", cache: "no-store",
    headers: { Authorization: `Basic ${Buffer.from(`${c.clientId}:${c.secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new PayPalError(response.status);
  const data = await response.json();
  if (typeof data.access_token !== "string" || typeof data.expires_in !== "number") throw new Error("Invalid token response");
  cached = { key, token: data.access_token, until: Date.now() + Math.max(0, data.expires_in - 60) * 1000 };
  return cached.token;
}
export async function paypalRequest<T>(path: string, body?: unknown, requestId?: string): Promise<T> {
  const c = getPayPalConfig();
  const response = await fetch(`${c.api}${path}`, { method: body === undefined ? "GET" : "POST", cache: "no-store",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json", Prefer: "return=representation",
      ...(requestId ? { "PayPal-Request-Id": requestId } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(8000) });
  if (!response.ok) { if (response.status === 401) cached = undefined; throw new PayPalError(response.status); }
  return response.json() as Promise<T>;
}
