// Shared with the quote page. Amounts are recalculated on the server at checkout.
export const RATES = { hour: 1.99, day: 24.99, week: 149.99, month: 290.00 } as const;

export function validatePrice(input: {
  rateType: unknown; units: unknown; timeZone: unknown;
  startAt: Date; endAt: Date; totalAmountPence: unknown;
}): number {
  const { rateType, units, startAt, endAt } = input;
  if (typeof units !== "number" || !Number.isInteger(units) || units < 1) {
    throw new Error("Invalid pricing units. Please refresh your quote.");
  }
  const duration = endAt.getTime() - startAt.getTime();
  let amount: number;
  if (rateType === "monthly") {
    if (units > 12 || typeof input.timeZone !== "string") throw new Error("Invalid monthly duration.");
    // Match the browser's calendar-month arithmetic, including month-end clamp and DST.
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: input.timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    });
    const parts = (date: Date) => Object.fromEntries(formatter.formatToParts(date).map(p => [p.type, Number(p.value)]));
    const s = parts(startAt); const e = parts(endAt);
    const target = new Date(Date.UTC(s.year, s.month - 1 + units, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    if (e.year !== target.getUTCFullYear() || e.month !== target.getUTCMonth() + 1 ||
        e.day !== Math.min(s.day, lastDay) || e.hour !== s.hour || e.minute !== s.minute || e.second !== s.second ||
        duration <= 0 || duration > 367 * 86_400_000) throw new Error("Cover dates do not match monthly pricing.");
    amount = units * Math.round(RATES.month * 100);
  } else {
    const rules: Record<string, [number, number, number]> = {
      hourly: [3_600_000, 24, Math.round(RATES.hour * 100)],
      daily: [86_400_000, 31, Math.round(RATES.day * 100)],
      weekly: [604_800_000, 4, Math.round(RATES.week * 100)],
    };
    const rule = typeof rateType === "string" && Object.hasOwn(rules, rateType) ? rules[rateType] : null;
    if (!rule || units > rule[1] || duration !== units * rule[0]) throw new Error("Cover dates do not match the selected duration.");
    amount = units * rule[2];
  }
  if (input.totalAmountPence !== amount) throw new Error("Your quote price has changed. Please refresh and try again.");
  return amount;
}
