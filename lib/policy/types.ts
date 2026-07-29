import type {
  PaymentProvider,
  PaymentStatus,
} from "@prisma/client";

export type PolicyFinalizeInput = {
  // Quote
  vrm: string;
  make?: string | null;
  model?: string | null;
  year?: string | null;
  startAt: string;
  endAt: string;
  durationMs: number;
  totalAmountPence: number;

  // Customer
  fullName: string;
  dob: string;
  email: string;
  licenceType: "UK" | "International" | "Learner";
  address: string;

  // Payment
  paymentProvider: PaymentProvider;
  paymentId: string;
  paymentStatus: PaymentStatus;
  currency?: string;

  // Legacy Stripe-only field.
  // Keep nullable so Stripe projects and existing records remain compatible.
  stripePaymentIntentId?: string | null;
};

export type PolicyFinalizeResult = {
  ok: true;
  policyId: string;
  policyNumber: string;
};