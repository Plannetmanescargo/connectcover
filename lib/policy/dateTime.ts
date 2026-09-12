// Policy instants are stored in UTC and displayed in UK civil time.
// A locale alone does not select a timezone. Never add a fixed hour for BST.
export const POLICY_TIME_ZONE = "Europe/London";

export function formatPolicyDateTime(
  iso: string,
  style: "proposal" | "certificate",
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: POLICY_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const day = `${value("day")} ${value("month")} ${value("year")}`;
  const time = `${value("hour")}:${value("minute")}`;
  return style === "certificate"
    ? `${time} hours - ${day}`
    : `${day} at ${time}`;
}

export function hasExplicitTimeZone(value: string): boolean {
  return /T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
}
