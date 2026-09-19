import { createHash } from "node:crypto";
import { prisma } from "@/db/prisma";
import { parseWorldpayEvent, type WorldpayEvent } from "./events";
import { processWorldpayEvent } from "./process-event";

export async function saveWorldpayJob(event: WorldpayEvent, environment: string) {
  const d = event.eventDetails;
  // Deliberately exclude card details, billing data and arbitrary provider fields.
  const minimal = JSON.parse(JSON.stringify({ eventId: event.eventId, eventDetails: {
    classification: d.classification, transactionReference: d.transactionReference, type: d.type,
    merchant: d.merchant === undefined ? undefined : { entity: d.merchant?.entity },
    paymentId: d.paymentId, amount: d.amount === undefined ? undefined : {
      value: d.amount?.value, currencyCode: d.amount?.currencyCode,
    },
  } }));
  const id = createHash("sha256").update(`${environment}:${event.eventId}`).digest("hex");
  await prisma.worldpayJob.upsert({ where: { id }, create: { id, environment, event: minimal }, update: {} });
  return id;
}

export async function runWorldpayJob(id: string) {
  const now = new Date();
  const lease = new Date(now.getTime() + 90_000);
  const claim = await prisma.worldpayJob.updateMany({ where: {
    id, completedAt: null, nextAttemptAt: { lte: now },
    OR: [{ leaseUntil: null }, { leaseUntil: { lte: now } }],
  }, data: { leaseUntil: lease, attempts: { increment: 1 } } });
  if (!claim.count) return;
  try {
    const job = await prisma.worldpayJob.findUniqueOrThrow({ where: { id } });
    const event = parseWorldpayEvent(job.event);
    if (event) await processWorldpayEvent(event, job.environment);
    await prisma.worldpayJob.updateMany({ where: { id, leaseUntil: lease }, data: {
      completedAt: new Date(), leaseUntil: null, lastError: null,
    } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown processing failure";
    // Retained until resolved; never silently discard a paid purchase.
    console.error("[worldpay worker] retry required", { jobId: id, error: message });
    await prisma.worldpayJob.updateMany({ where: { id, leaseUntil: lease }, data: {
      leaseUntil: null, nextAttemptAt: new Date(Date.now() + 60_000), lastError: message.slice(0, 500),
    } });
  }
}

export async function drainWorldpayJobs() {
  const now = new Date();
  const jobs = await prisma.worldpayJob.findMany({ where: {
    completedAt: null, nextAttemptAt: { lte: now },
    OR: [{ leaseUntil: null }, { leaseUntil: { lte: now } }],
  }, orderBy: { nextAttemptAt: "asc" }, take: 4, select: { id: true } });
  await Promise.all(jobs.map(job => runWorldpayJob(job.id)));
}
