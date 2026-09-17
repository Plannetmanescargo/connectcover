export function getWorldpayEnvironment() {
  const environment = process.env.WORLDPAY_ENVIRONMENT?.trim();
  if (environment !== "try" && environment !== "live") throw new Error("Set WORLDPAY_ENVIRONMENT to try or live.");
  return environment;
}

export function getWorldpayWebhookKeys(): Record<string, string> {
  const keyId = process.env.WORLDPAY_WEBHOOK_KEY_ID?.trim();
  const secret = process.env.WORLDPAY_WEBHOOK_SECRET;
  if (!keyId || !/^\d+$/.test(keyId) || !secret) throw new Error("Worldpay webhook signing configuration is missing.");
  return { [keyId]: secret };
}

export function getWorldpayConfig() {
  const environment = getWorldpayEnvironment();
  const username = process.env.WORLDPAY_API_USERNAME?.trim();
  const password = process.env.WORLDPAY_API_PASSWORD;
  const entity = process.env.WORLDPAY_ENTITY?.trim();
  const narrative = process.env.WORLDPAY_NARRATIVE?.trim();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (!username || username.includes(":") || !password || !entity || entity.length > 32 ||
      !narrative || narrative.length > 24 || !baseUrl) throw new Error("Worldpay payment configuration is missing or invalid.");
  const url = new URL(baseUrl);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("NEXT_PUBLIC_BASE_URL must be the canonical HTTPS origin.");
  }
  // Do not accept payments until signed notifications can be processed.
  getWorldpayWebhookKeys();
  return {
    environment, entity, narrative, origin: url.origin,
    endpoint: environment === "live" ? "https://access.worldpay.com/payment_pages" : "https://try.access.worldpay.com/payment_pages",
    authorization: `Basic ${Buffer.from(`${username}:${password}`, "utf8").toString("base64")}`,
  };
}
