ALTER TYPE "PaymentProvider" ADD VALUE 'PAYPAL';
ALTER TABLE "PaymentCheckout"
  ADD COLUMN "paypalRequestKey" TEXT,
  ADD COLUMN "paypalRequestHash" TEXT,
  ADD COLUMN "paypalOrderId" TEXT,
  ADD COLUMN "paypalCaptureId" TEXT,
  ADD COLUMN "paypalMode" TEXT,
  ADD COLUMN "paypalMerchantId" TEXT,
  ADD COLUMN "paypalConfigHash" TEXT,
  ADD COLUMN "paypalCaptureStartedAt" TIMESTAMP(3),
  ADD COLUMN "paypalProcessingUntil" TIMESTAMP(3),
  ADD COLUMN "paypalFulfilledAt" TIMESTAMP(3),
  ADD COLUMN "paypalNextAttemptAt" TIMESTAMP(3),
  ADD COLUMN "paypalReviewReason" TEXT;
CREATE UNIQUE INDEX "PaymentCheckout_paypalRequestKey_key" ON "PaymentCheckout"("paypalRequestKey");
CREATE UNIQUE INDEX "PaymentCheckout_paypalOrderId_key" ON "PaymentCheckout"("paypalOrderId");
CREATE UNIQUE INDEX "PaymentCheckout_paypalCaptureId_key" ON "PaymentCheckout"("paypalCaptureId");
CREATE INDEX "PaymentCheckout_paymentProvider_paypalNextAttemptAt_idx" ON "PaymentCheckout"("paymentProvider", "paypalNextAttemptAt");
