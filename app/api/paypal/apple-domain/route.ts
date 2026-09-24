import { readFile } from "node:fs/promises";
import path from "node:path";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const enabled = process.env.PAYPAL_APPLE_PAY_ENABLED === "true";
  const mode = process.env.PAYPAL_ENVIRONMENT || "sandbox";
  if (enabled && mode !== "sandbox" && mode !== "live") return new Response("Not configured", { status: 503 });
  const file = enabled ? `lib/paypal/domains/${mode}.txt` : "public/.well-known/apple-developer-merchantid-domain-association";
  const content = await readFile(path.join(process.cwd(), file));
  return new Response(content, { headers: { "Content-Type": "application/octet-stream", "Cache-Control": "no-store" } });
}
