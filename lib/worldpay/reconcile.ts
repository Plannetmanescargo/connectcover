import { prisma } from "@/db/prisma";
import { getWorldpayConfig } from "./config";
import { assertWorldpayPayment, type WorldpayEvent } from "./events";
import { runWorldpayJob, saveWorldpayJob } from "./jobs";

type QueryPayment = {
  paymentId?: unknown; transactionReference?: unknown; entity?: unknown;
  lastEvent?: unknown; value?: { amount?: unknown; currency?: unknown };
  events?: { eventName?: unknown; type?: unknown }[];
};

// Conservative mapping: authorization alone, partial capture, refunds and
// unknown states must never become an issued policy through this fallback.
export function settlementFromQuery(payment: QueryPayment): WorldpayEvent | null {
  if (payment.lastEvent !== "settlementRequestSubmitted" ||
      typeof payment.paymentId !== "string" || !payment.paymentId ||
      typeof payment.transactionReference !== "string" || typeof payment.entity !== "string" ||
      typeof payment.value?.amount !== "number" || typeof payment.value.currency !== "string" ||
      !Array.isArray(payment.events) ||
      !payment.events.some(e => e.eventName === "settlementRequestSubmitted") ||
      payment.events.some(e => e.type === "partialSettlement")) return null;
  return { eventId: `query:${payment.paymentId}:settlementRequestSubmitted`, eventDetails: {
    classification: "payment", type: "sentForSettlement", paymentId: payment.paymentId,
    transactionReference: payment.transactionReference, merchant: { entity: payment.entity },
    amount: { value: payment.value.amount, currencyCode: payment.value.currency },
  } };
}

export async function reconcileWorldpayCheckout(id: string) {
  if (process.env.WORLDPAY_PAYMENT_QUERIES_ENABLED !== "true") return;
  try {
    const config = getWorldpayConfig();
    const checkout = await prisma.paymentCheckout.findUnique({ where: { id } });
    if (!checkout || checkout.paymentProvider !== "WORLDPAY" || checkout.brand !== "coverza" ||
        checkout.status === "PAID" || checkout.worldpayEnvironment !== config.environment ||
        checkout.worldpayEntity !== config.entity || !checkout.worldpayTransactionReference ||
        checkout.createdAt.getTime() < Date.now() - 30 * 60_000) return;
    // Database cooldown bounds provider queries across tabs and server instances.
    const now = new Date();
    const claim = await prisma.paymentCheckout.updateMany({ where: {
      id, status: { not: "PAID" }, OR: [{ worldpayQueryAfter: null }, { worldpayQueryAfter: { lte: now } }],
    }, data: { worldpayQueryAfter: new Date(now.getTime() + 10_000) } });
    if (!claim.count) return;
    const origin = new URL(config.endpoint).origin;
    const query = async (path: string) => {
      const response = await fetch(`${origin}${path}`, { cache: "no-store", redirect: "error",
        signal: AbortSignal.timeout(3000), headers: { Authorization: config.authorization,
          Accept: "application/vnd.worldpay.payment-queries-v1.hal+json" },
      });
      if (!response.ok) {
        if ([401, 403, 429].includes(response.status)) {
          await prisma.paymentCheckout.update({ where: { id }, data: { worldpayQueryAfter: new Date(Date.now() + 300_000) } });
        }
        throw new Error(`Payment Queries HTTP ${response.status}`);
      }
      return response.json();
    };
    const result = await query(`/paymentQueries/payments?transactionReference=${encodeURIComponent(checkout.worldpayTransactionReference)}`);
    const payments: QueryPayment[] = result?._embedded?.payments;
    if (!Array.isArray(payments) || payments.length !== 1 || result?._links?.next) return;
    const summary = payments[0];
    if (summary.transactionReference !== checkout.worldpayTransactionReference || summary.entity !== checkout.worldpayEntity ||
        typeof summary.paymentId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(summary.paymentId)) return;
    // Construct a fixed provider URL; never follow an arbitrary returned link.
    const detail = await query(`/paymentQueries/payments/${encodeURIComponent(summary.paymentId)}`);
    if (detail?.paymentId !== summary.paymentId) return;
    const event = settlementFromQuery(detail);
    if (!event) return;
    assertWorldpayPayment(event, checkout);
    const jobId = await saveWorldpayJob(event, config.environment);
    console.info("[worldpay query] settlement verified", { checkoutId: id, jobId });
    await runWorldpayJob(jobId);
  } catch (error) {
    // Webhooks remain operational even when this account cannot access Queries.
    console.warn("[worldpay query] fallback unavailable", { checkoutId: id,
      error: error instanceof Error ? error.message : "Unknown query error" });
  }
}
