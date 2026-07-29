-- CreateEnum
CREATE TYPE "CheckoutStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');

-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'SQUARE';

-- CreateTable
CREATE TABLE "PaymentCheckout" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "status" "CheckoutStatus" NOT NULL DEFAULT 'PENDING',
    "vrm" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "year" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "durationMs" BIGINT NOT NULL,
    "totalAmountPence" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "licenceType" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "paymentProvider" "PaymentProvider" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "squarePaymentLinkId" TEXT,
    "squareOrderId" TEXT,
    "squarePaymentId" TEXT,
    "policyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCheckout_squarePaymentLinkId_key" ON "PaymentCheckout"("squarePaymentLinkId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCheckout_squareOrderId_key" ON "PaymentCheckout"("squareOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCheckout_squarePaymentId_key" ON "PaymentCheckout"("squarePaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCheckout_policyId_key" ON "PaymentCheckout"("policyId");

-- CreateIndex
CREATE INDEX "PaymentCheckout_brand_idx" ON "PaymentCheckout"("brand");

-- CreateIndex
CREATE INDEX "PaymentCheckout_status_idx" ON "PaymentCheckout"("status");

-- CreateIndex
CREATE INDEX "PaymentCheckout_email_idx" ON "PaymentCheckout"("email");

-- CreateIndex
CREATE INDEX "PaymentCheckout_createdAt_idx" ON "PaymentCheckout"("createdAt");
