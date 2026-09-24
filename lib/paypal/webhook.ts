import { paypalRequest } from "./client";
import { getPayPalConfig } from "./config";
export async function verifyPayPalWebhook(headers: Headers, event: unknown) {
  const fields: Record<string, string> = {};
  for (const [key, header] of Object.entries({ auth_algo: "paypal-auth-algo", cert_url: "paypal-cert-url",
    transmission_id: "paypal-transmission-id", transmission_sig: "paypal-transmission-sig", transmission_time: "paypal-transmission-time" })) {
    const value = headers.get(header);
    if (!value || value.length > 4096) return false;
    fields[key] = value;
  }
  const result = await paypalRequest<{ verification_status: string }>("/v1/notifications/verify-webhook-signature", {
    ...fields, webhook_id: getPayPalConfig().webhookId, webhook_event: event,
  });
  return result.verification_status === "SUCCESS";
}
