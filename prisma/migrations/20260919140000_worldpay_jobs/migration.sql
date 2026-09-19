ALTER TABLE "PaymentCheckout" ADD COLUMN "worldpayQueryAfter" TIMESTAMP(3);
CREATE TABLE "WorldpayJob" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "environment" TEXT NOT NULL,
  "event" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leaseUntil" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT
);
CREATE INDEX "WorldpayJob_completedAt_nextAttemptAt_idx" ON "WorldpayJob"("completedAt", "nextAttemptAt");
