ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'MOLLIE';
ALTER TABLE "PaymentCheckout"
  ADD COLUMN "mollieRequestKey" TEXT,
  ADD COLUMN "mollieRequestHash" TEXT,
  ADD COLUMN "mollieConfigHash" TEXT,
  ADD COLUMN "molliePaymentId" TEXT,
  ADD COLUMN "mollieMode" TEXT,
  ADD COLUMN "mollieProfileId" TEXT,
  ADD COLUMN "mollieCheckoutUrl" TEXT,
  ADD COLUMN "mollieProcessingUntil" TIMESTAMP(3),
  ADD COLUMN "mollieFulfilledAt" TIMESTAMP(3),
  ADD COLUMN "mollieNextAttemptAt" TIMESTAMP(3),
  ADD COLUMN "mollieReviewReason" TEXT;
CREATE UNIQUE INDEX "PaymentCheckout_mollieRequestKey_key" ON "PaymentCheckout"("mollieRequestKey");
CREATE UNIQUE INDEX "PaymentCheckout_molliePaymentId_key" ON "PaymentCheckout"("molliePaymentId");
CREATE INDEX "PaymentCheckout_paymentProvider_mollieNextAttemptAt_idx" ON "PaymentCheckout"("paymentProvider", "mollieNextAttemptAt");
