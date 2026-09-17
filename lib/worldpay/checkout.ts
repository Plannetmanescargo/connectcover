import { hasExplicitTimeZone } from "../policy/dateTime";
import { validatePrice } from "../payments/pricing";

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid checkout request.");
  return value as Record<string, unknown>;
}
function text(value: unknown, name: string, max = 500): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`Invalid ${name}.`);
  return value.trim();
}
function optional(value: unknown): string | null {
  return value === undefined || value === null || value === "" ? null : text(value, "vehicle details", 100);
}

export function validateWorldpayCheckout(value: unknown) {
  const body = object(value); const q = object(body.quote); const c = object(body.customer);
  const pricing = object(body.pricing);
  const start = text(q.startAt, "start time"); const end = text(q.endAt, "end time");
  if (!hasExplicitTimeZone(start) || !hasExplicitTimeZone(end)) throw new Error("Please refresh the quote page and confirm your cover times.");
  const startAt = new Date(start); const endAt = new Date(end);
  const durationMs = endAt.getTime() - startAt.getTime();
  if (!Number.isSafeInteger(durationMs) || durationMs <= 0 || q.durationMs !== durationMs) throw new Error("Invalid cover duration.");
  const totalAmountPence = validatePrice({ ...pricing, rateType: pricing.rateType, units: pricing.units,
    timeZone: pricing.timeZone, startAt, endAt, totalAmountPence: q.totalAmountPence });
  const vrm = text(q.vrm, "registration", 12).toUpperCase().replace(/\s/g, "");
  if (!/^[A-Z0-9]{2,8}$/.test(vrm)) throw new Error("Invalid registration.");
  const fullName = text(c.fullName, "name", 200);
  const email = text(c.email, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email address.");
  const dobText = text(c.dob, "date of birth", 10);
  const dob = new Date(dobText);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dobText) || !Number.isFinite(dob.getTime()) || dob.toISOString().slice(0, 10) !== dobText || dob.getTime() > Date.now()) throw new Error("Invalid date of birth.");
  const licence = text(c.licenceType, "licence type");
  const licenceType = licence === "Full UK" || licence === "UK" ? "UK" : licence;
  if (licenceType !== "UK" && licenceType !== "International" && licenceType !== "Learner") throw new Error("Invalid licence type.");
  return { vrm, make: optional(q.make), model: optional(q.model), year: optional(q.year),
    startAt, endAt, durationMs: BigInt(durationMs), totalAmountPence,
    fullName, dob, email, licenceType, address: text(c.address, "address", 1000) };
}
