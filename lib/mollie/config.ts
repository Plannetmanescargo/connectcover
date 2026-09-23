import { createHash } from "node:crypto";

export function getMollieConfig(env: Record<string, string | undefined> = process.env) {
  const apiKey = env.MOLLIE_API_KEY?.trim() || "";
  const mode = env.MOLLIE_ENVIRONMENT?.trim() || "test";
  if ((mode !== "test" && mode !== "live") || !apiKey.startsWith(`${mode}_`) || apiKey.length < 10) {
    throw new Error("Mollie configuration is missing or the key does not match the environment.");
  }
  const url = new URL(env.NEXT_PUBLIC_BASE_URL?.trim() || "");
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("NEXT_PUBLIC_BASE_URL must be a public HTTPS origin.");
  }
  if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw new Error("Mollie needs a public callback URL.");
  return { apiKey, mode, origin: url.origin, fingerprint: createHash("sha256").update(`${apiKey}:${url.origin}`).digest("hex") };
}
