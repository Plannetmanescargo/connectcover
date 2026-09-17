ALTER TYPE "PaymentProvider" ADD VALUE 'WORLDPAY';
ALTER TABLE "PaymentCheckout"
  ADD COLUMN "worldpayTransactionReference" TEXT,
  ADD COLUMN "worldpayPaymentId" TEXT,
  ADD COLUMN "worldpayEntity" TEXT,
  ADD COLUMN "worldpayEnvironment" TEXT,
  ADD COLUMN "worldpayProcessingUntil" TIMESTAMP(3),
  ADD COLUMN "worldpayFulfilledAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "PaymentCheckout_worldpayTransactionReference_key" ON "PaymentCheckout"("worldpayTransactionReference");
CREATE UNIQUE INDEX "PaymentCheckout_worldpayPaymentId_key" ON "PaymentCheckout"("worldpayPaymentId");
