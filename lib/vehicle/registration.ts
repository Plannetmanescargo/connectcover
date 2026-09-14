export function normaliseRegistration(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 20) return null;
  const plate = value.replace(/\s/g, "").toUpperCase();
  // Includes short cherished and Northern Irish plates; format screening does
  // not establish whether the registration exists.
  return /^[A-Z0-9]{2,8}$/.test(plate) && /[A-Z]/.test(plate) && /[0-9]/.test(plate) ? plate : null;
}

