ALTER TABLE "PaymentCheckout"
  ADD COLUMN "stripeRequestKey" TEXT,
  ADD COLUMN "stripeRequestHash" TEXT,
  ADD COLUMN "stripeConfigHash" TEXT,
  ADD COLUMN "stripeCheckoutSessionId" TEXT,
  ADD COLUMN "stripePaymentIntentId" TEXT,
  ADD COLUMN "stripeCheckoutUrl" TEXT,
  ADD COLUMN "stripeLivemode" BOOLEAN,
  ADD COLUMN "stripeProcessingUntil" TIMESTAMP(3),
  ADD COLUMN "stripeFulfilledAt" TIMESTAMP(3),
  ADD COLUMN "stripeNextAttemptAt" TIMESTAMP(3),
  ADD COLUMN "stripeReviewReason" TEXT;
CREATE UNIQUE INDEX "PaymentCheckout_stripeRequestKey_key" ON "PaymentCheckout"("stripeRequestKey");
CREATE UNIQUE INDEX "PaymentCheckout_stripeCheckoutSessionId_key" ON "PaymentCheckout"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "PaymentCheckout_stripePaymentIntentId_key" ON "PaymentCheckout"("stripePaymentIntentId");
CREATE INDEX "PaymentCheckout_paymentProvider_stripeNextAttemptAt_idx" ON "PaymentCheckout"("paymentProvider", "stripeNextAttemptAt");
