// lib/policy/validate.ts
import type { PolicyFinalizeInput } from "./types";

export function validateFinalizeInput(input: PolicyFinalizeInput) {
  const errors: string[] = [];

  const required = (key: keyof PolicyFinalizeInput) => {
    const value = input[key];

    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && !value.trim())
    ) {
      errors.push(`${String(key)} is required`);
    }
  };

  required("vrm");
  required("startAt");
  required("endAt");
  required("durationMs");
  required("totalAmountPence");
  required("fullName");
  required("dob");
  required("email");
  required("licenceType");
  required("address");
  required("paymentProvider");
  required("paymentId");
  required("paymentStatus");

  const durationMs = Number(input.durationMs);
  const totalAmountPence = Number(input.totalAmountPence);

  // Numeric validation
  if (!Number.isFinite(durationMs)) {
    errors.push("durationMs must be a number");
  }

  if (!Number.isFinite(totalAmountPence)) {
    errors.push("totalAmountPence must be a number");
  }

  if (Number.isFinite(durationMs) && !Number.isInteger(durationMs)) {
    errors.push("durationMs must be an integer");
  }

  if (
    Number.isFinite(totalAmountPence) &&
    !Number.isInteger(totalAmountPence)
  ) {
    errors.push("totalAmountPence must be an integer");
  }

  if (Number.isFinite(durationMs) && durationMs <= 0) {
    errors.push("durationMs must be > 0");
  }

  if (Number.isFinite(totalAmountPence) && totalAmountPence <= 0) {
    errors.push("totalAmountPence must be > 0");
  }

  // Policy date validation
  const start = new Date(input.startAt);
  const end = new Date(input.endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    errors.push("startAt/endAt must be valid ISO dates");
  } else {
    if (end.getTime() <= start.getTime()) {
      errors.push("endAt must be after startAt");
    }

    if (Number.isFinite(durationMs)) {
      const calculatedDurationMs = end.getTime() - start.getTime();
      const toleranceMs = 5 * 60 * 1000;

      if (
        Math.abs(calculatedDurationMs - durationMs) >
        toleranceMs
      ) {
        errors.push("durationMs does not match startAt/endAt");
      }
    }
  }

  // Customer validation
  const email = String(input.email ?? "")
    .trim()
    .toLowerCase();

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!emailIsValid) {
    errors.push("email is invalid");
  }

  const dob = new Date(input.dob);

  if (Number.isNaN(dob.getTime())) {
    errors.push("dob is invalid");
  } else if (dob.getTime() > Date.now()) {
    errors.push("dob cannot be in the future");
  }

  const allowedLicenceTypes = [
    "UK",
    "International",
    "Learner",
  ] as const;

  if (!allowedLicenceTypes.includes(input.licenceType)) {
    errors.push("licenceType is invalid");
  }

  const allowedPaymentProviders = [
    "STRIPE",
    "SQUARE",
  ] as const;

  if (!allowedPaymentProviders.includes(input.paymentProvider)) {
    errors.push("paymentProvider is invalid");
  }

  const allowedPaymentStatuses = [
    "PENDING",
    "PAID",
    "FAILED",
    "REFUNDED",
  ] as const;

  if (!allowedPaymentStatuses.includes(input.paymentStatus)) {
    errors.push("paymentStatus is invalid");
  }

  const currency = String(input.currency ?? "GBP")
    .trim()
    .toUpperCase();

  if (currency !== "GBP") {
    errors.push("currency must be GBP");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}