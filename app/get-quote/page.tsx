"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/site/PageShell";

/* =========================================================
   Types
========================================================= */
type Step = 1 | 2 | 3 | 4 | 5;
type DurationUnit = "hours" | "days" | "weeks" | "months";
type CoverChoice = "1hour" | "1day" | "1week" | "1month" | "custom";
type DrivingLicenceType = "Full UK" | "International" | "Learner";

type VehicleLookupSummary = {
  make?: string; model?: string; year?: string | number;
  colour?: string; fuelType?: string;
};
type AddressStructured = {
  line1: string; line2: string; town: string; county: string; postcode: string;
};
type CustomerDetails = {
  fullName: string; dob: string; email: string; licenceType: DrivingLicenceType;
};
type PriceResult = {
  label: string; helper: string; unitLabel: string;
  units: number; unitPrice: number; total: number;
  rateType: "hourly" | "daily" | "weekly" | "monthly";
};

/* =========================================================
   Constants
========================================================= */
const UNIT_CONFIG: Record<DurationUnit, { label: string; min: number; max: number; step: number }> = {
  hours:  { label: "Hours",  min: 1,  max: 24, step: 1 },
  days:   { label: "Days",   min: 1,  max: 31, step: 1 },
  weeks:  { label: "Weeks",  min: 1,  max: 4,  step: 1 },
  months: { label: "Months", min: 1,  max: 12, step: 1 },
};

// Rates per unit
const RATES = {
  hour:  1.99,
  day:   24.99,
  week:  149.99,
  month: 290.00,
} as const;

/* =========================================================
   Helpers
========================================================= */
function moneyGBP(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}
function validEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }
function pad2(n: number) { return String(n).padStart(2, "0"); }
function toDatetimeLocalValue(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function parseDTL(v: string) { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; }
function prettyDateTime(v: string) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
function normaliseVrm(v: string) { return v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8); }
function formatVrm(v: string) { const s = normaliseVrm(v); return s.length <= 4 ? s : `${s.slice(0, 4)} ${s.slice(4)}`; }
function normalisePostcode(p: string) { return p.toUpperCase().replace(/\s+/g, " ").trim(); }
function buildAddressString(a: AddressStructured) {
  return [a.line1, a.line2, a.town, a.county, normalisePostcode(a.postcode)].map(s => s.trim()).filter(Boolean).join(", ");
}
function calcAge(dob: string) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}
function calcAgeDetailed(dob: string) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  let months = now.getMonth() - d.getMonth();
  if (now.getDate() < d.getDate()) months--;
  if (months < 0) { years--; months += 12; }
  if (years < 0) return null;
  return { years, months };
}
function makeQuoteRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "CVZ-";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }

/**
 * Add N calendar months to a start datetime, preserving time-of-day.
 * If the resulting month has fewer days than the start day, clamps to last day.
 */
function addMonthsToStart(iso: string, n: number) {
  const s = new Date(iso);
  if (Number.isNaN(s.getTime())) return "";
  const absMonth = s.getMonth() + n;
  const ty = s.getFullYear() + Math.floor(absMonth / 12);
  const tm = ((absMonth % 12) + 12) % 12;
  const sd = Math.min(s.getDate(), daysInMonth(ty, tm));
  return toDatetimeLocalValue(new Date(ty, tm, sd, s.getHours(), s.getMinutes(), 0, 0));
}

function addDurationMs(iso: string, ms: number) {
  const s = new Date(iso);
  if (Number.isNaN(s.getTime())) return "";
  return toDatetimeLocalValue(new Date(s.getTime() + ms));
}

function clampDuration(v: number, unit: DurationUnit) {
  const { min, max } = UNIT_CONFIG[unit];
  return Math.min(max, Math.max(min, v));
}

function calculateEndAt(startIso: string, valStr: string, unit: DurationUnit) {
  if (!startIso) return "";
  const n = clampDuration(Number(valStr) || 0, unit);
  if (n <= 0) return "";
  if (unit === "months") return addMonthsToStart(startIso, n);
  const H = 3_600_000;
  const ms = unit === "hours" ? n * H : unit === "days" ? n * 24 * H : n * 7 * 24 * H;
  return addDurationMs(startIso, ms);
}

/**
 * Detect how many whole calendar months fit between start and end.
 * Returns null if the span is not a clean N-month boundary.
 * Used to decide whether to bill monthly vs weekly.
 *
 * Logic: start + N months === end (same day-of-month, same time).
 * We check N = 1..12 and return the first match.
 */
function detectWholeMonths(startIso: string, endIso: string): number | null {
  if (!startIso || !endIso) return null;
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  // Quick sanity: end must be after start
  if (e <= s) return null;
  for (let n = 1; n <= 12; n++) {
    const candidate = addMonthsToStart(startIso, n);
    if (candidate && candidate === endIso) return n;
    // Also compare as timestamps in case of minute-level rounding drift
    const cDate = new Date(candidate);
    if (!Number.isNaN(cDate.getTime()) && Math.abs(cDate.getTime() - e.getTime()) < 60_000) {
      return n;
    }
  }
  return null;
}

/**
 * For a custom range, figure out how many calendar months it spans
 * even if it's not a clean boundary. Used to decide whether monthly
 * billing applies when the window is >= 1 month long.
 *
 * Returns the number of months to bill (ceiling), or null if < 1 month.
 */
function calcMonthsBilling(startIso: string, endIso: string): number | null {
  if (!startIso || !endIso) return null;
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  if (e <= s) return null;

  // Find the first month boundary >= end
  for (let n = 1; n <= 12; n++) {
    const boundary = new Date(addMonthsToStart(startIso, n));
    if (Number.isNaN(boundary.getTime())) continue;
    // end falls within this month span → bill for n months
    if (e <= boundary) return n;
  }
  return 12; // cap
}

function formatDurationFromMs(ms: number) {
  if (!ms) return "—";
  const totalH = Math.ceil(ms / 3_600_000);
  if (totalH < 24) return `${totalH} hour${totalH === 1 ? "" : "s"}`;
  const d = Math.floor(totalH / 24);
  const r = totalH % 24;
  return r === 0 ? `${d} day${d === 1 ? "" : "s"}` : `${d}d ${r}h`;
}

function getRoundedNow() {
  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 5) * 5, 0, 0);
  return toDatetimeLocalValue(now);
}
function splitDTL(v: string) {
  if (!v) return { date: "", time: "" };
  const [date, time = ""] = v.split("T");
  return { date, time: time.slice(0, 5) };
}
function joinDTL(date: string, time: string) { return date && time ? `${date}T${time}` : ""; }

/* =========================================================
   SVG Icons — inline, no external dependency
========================================================= */
function IconClock({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6.5v4l2.5 1.5" />
    </svg>
  );
}
function IconCalendarDay({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4.5" width="14" height="13" rx="2.5" />
      <path d="M7 3v3m6-3v3M3 9.5h14" />
      <path d="M10 13.5h.01" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconCalendarWeek({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4.5" width="14" height="13" rx="2.5" />
      <path d="M7 3v3m6-3v3M3 9.5h14M6 13h2m4 0h2" />
    </svg>
  );
}
function IconCalendarMonth({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4.5" width="14" height="13" rx="2.5" />
      <path d="M7 3v3m6-3v3M3 9.5h14M6 13h2m4 0h2M6 16.5h8" />
    </svg>
  );
}
function IconSliders({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h14M3 10h8M3 14h5" />
      <circle cx="14" cy="6" r="1.75" />
      <circle cx="13" cy="14" r="1.75" />
    </svg>
  );
}
function IconCheck({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8.5 6.2 11.5 13 5" />
    </svg>
  );
}
function IconArrow({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8h10M8.5 4 13 8l-4.5 4" />
    </svg>
  );
}
function IconSpinner({ className = "h-4 w-4 animate-spin" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 60" strokeLinecap="round" />
    </svg>
  );
}

/* =========================================================
   Atoms
========================================================= */
function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2.5 flex items-start gap-1.5 text-[12.5px] font-medium leading-snug text-red-600">
      <svg className="mt-px h-3.5 w-3.5 shrink-0" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
        <path d="M7 1a6 6 0 1 0 0 12A6 6 0 0 0 7 1Zm0 3.5a.65.65 0 0 1 .65.65v2.2a.65.65 0 0 1-1.3 0V5.15A.65.65 0 0 1 7 4.5Zm0 5.25a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75Z" />
      </svg>
      {children}
    </p>
  );
}
function InputHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-[12px] leading-snug text-slate-400">{children}</p>;
}
function InputLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-2.5 block text-[13.5px] font-semibold text-slate-800">
      {children}
    </label>
  );
}

/* =========================================================
   PROGRESS RAIL
========================================================= */
const STEP_META: Record<Step, { short: string; long: string }> = {
  1: { short: "Vehicle",  long: "Your vehicle"   },
  2: { short: "Cover",    long: "Cover period"   },
  3: { short: "Driver",   long: "Driver details" },
  4: { short: "Address",  long: "Address"        },
  5: { short: "Review",   long: "Review & pay"   },
};

function ProgressRail({ activeStep, total }: { activeStep: Step; total: number }) {
  return (
    <div className="select-none overflow-hidden rounded-[1.65rem] border border-slate-200/75 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.045)]">
      {/* Mobile summary */}
      <div className="flex items-center justify-between px-4 py-4 sm:hidden">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[rgb(108,76,243)]">
            Step {activeStep} of {total}
          </p>
          <p className="mt-1 text-[15px] font-extrabold tracking-[-0.03em] text-slate-950">
            {STEP_META[activeStep]?.long}
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(108,76,243,0.08)] text-[13px] font-black text-[rgb(108,76,243)]">
          {activeStep}
        </div>
      </div>
      {/* Mobile progress bar */}
      <div className="h-[3px] bg-slate-100 sm:hidden">
        <div
          className="h-full bg-[rgb(108,76,243)] transition-all duration-500 ease-out"
          style={{ width: `${Math.max(8, (activeStep / total) * 100)}%` }}
        />
      </div>

      {/* Desktop arrow-trail layout */}
      <div className="hidden sm:grid" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
        {Array.from({ length: total }).map((_, i) => {
          const s = (i + 1) as Step;
          const done   = s < activeStep;
          const active = s === activeStep;
          const meta   = STEP_META[s];
          return (
            <div
              key={s}
              className={[
                "relative min-w-0 border-l border-slate-100 first:border-l-0",
                active ? "bg-[rgba(108,76,243,0.055)]" : "bg-white",
              ].join(" ")}
            >
              {/* Chevron separator */}
              {i !== total - 1 && (
                <div className="absolute right-[-13px] top-0 z-20 h-full w-[26px] overflow-hidden" aria-hidden="true">
                  <div className={[
                    "absolute right-[9px] top-1/2 h-[38px] w-[38px] -translate-y-1/2 rotate-45 border-r border-t",
                    active ? "border-[rgba(108,76,243,0.18)] bg-[rgb(249,247,255)]" : "border-slate-100 bg-white",
                  ].join(" ")} />
                </div>
              )}

              <div className="relative z-10 flex items-center gap-3 px-4 py-4">
                <span className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition-all duration-300",
                  done   ? "bg-[rgb(108,76,243)] text-white shadow-[0_8px_20px_rgba(108,76,243,0.18)]"
                  : active ? "bg-white text-[rgb(108,76,243)] ring-1 ring-[rgba(108,76,243,0.35)] shadow-[0_0_0_4px_rgba(108,76,243,0.08)]"
                  : "bg-slate-100 text-slate-400 ring-1 ring-slate-200/70",
                ].join(" ")}>
                  {done ? <IconCheck className="h-3.5 w-3.5" /> : s}
                </span>
                <div className="min-w-0">
                  <p className={[
                    "truncate text-[12px] font-bold tracking-[-0.015em]",
                    active ? "text-slate-950" : done ? "text-[rgb(108,76,243)]" : "text-slate-400",
                  ].join(" ")}>
                    <span className="md:hidden">{meta.short}</span>
                    <span className="hidden md:inline">{meta.long}</span>
                  </p>
                  <p className={[
                    "mt-0.5 hidden text-[10.5px] font-medium lg:block",
                    active ? "text-slate-500" : done ? "text-[rgb(108,76,243)]/55" : "text-slate-300",
                  ].join(" ")}>
                    {done ? "Complete" : active ? "Current step" : "Upcoming"}
                  </p>
                </div>
              </div>

              {/* Active underline */}
              {active && (
                <span className="absolute inset-x-4 bottom-0 z-30 h-[2px] rounded-full bg-[rgb(108,76,243)]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   STEP SHELL
========================================================= */
function StepShell({
  step, total, heading, sub, children,
  onContinue, continueLabel, onBack,
  continueDisabled = false, continueLoading = false,
}: {
  step: Step; total: number;
  heading: React.ReactNode; sub?: string;
  children: React.ReactNode;
  onContinue: () => void; continueLabel: string;
  onBack?: () => void;
  continueDisabled?: boolean; continueLoading?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2.25rem] border border-slate-200/70 bg-white shadow-[0_24px_80px_rgba(108,76,243,0.07),0_2px_8px_rgba(15,23,42,0.04)]">
      <div className="h-[3px] w-full bg-[rgb(108,76,243)]" />
      <div className="px-6 pb-8 pt-7 sm:px-10 sm:pb-10 sm:pt-8">
        <h2 className="text-[1.75rem] font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-[2.4rem]">
          {heading}
        </h2>
        {sub && (
          <p className="mt-3 max-w-[38rem] text-[0.93rem] leading-[1.8] text-slate-500">{sub}</p>
        )}
        <div className="mt-8">{children}</div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onContinue}
            disabled={continueDisabled || continueLoading}
            className="inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-[rgb(108,76,243)] px-8 text-[15px] font-semibold !text-white shadow-[0_12px_36px_rgba(108,76,243,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[rgb(96,66,225)] hover:shadow-[0_16px_44px_rgba(108,76,243,0.36)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[0_12px_36px_rgba(108,76,243,0.28)] sm:w-auto"
          >
            {continueLoading ? <><IconSpinner />Processing…</> : <>{continueLabel}<IconArrow /></>}
          </button>
          {onBack && (
            <button type="button" onClick={onBack}
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-[15px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98] sm:w-auto">
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MOBILE STICKY BAR
========================================================= */
function MobileStickyBar({
  step, total, price, canContinue, loading, onContinue,
}: {
  step: Step; total: number; price: PriceResult | null;
  canContinue: boolean; loading: boolean; onContinue: () => void;
}) {
  const ctaLabel: Record<Step, string> = {
    1: "Continue", 2: "Continue", 3: "Continue", 4: "Review quote",
    5: loading ? "Processing…" : price ? `Pay ${moneyGBP(price.total)}` : "Pay now",
  };
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white/97 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="container-app py-3">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Step {step} of {total}
            </p>
            {step === 5 && price ? (
              <p className="text-[15px] font-extrabold tracking-tight text-slate-950">
                {moneyGBP(price.total)}
                <span className="ml-1.5 text-[11px] font-medium text-slate-400">inc. VAT</span>
              </p>
            ) : (
              <p className="text-[13px] font-semibold text-slate-700">{STEP_META[step]?.long ?? ""}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue || loading}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[rgb(108,76,243)] px-5 py-3 text-[14px] font-semibold !text-white shadow-[0_6px_20px_rgba(108,76,243,0.28)] transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <IconSpinner /> : null}
            {ctaLabel[step]}
            {!loading && <IconArrow />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */
export default function GetQuotePage() {
  const TOTAL_STEPS = 5;

  const [activeStep,      setActiveStep]      = useState<Step>(1);
  const [quoteRef,        setQuoteRef]        = useState("");
  const [formError,       setFormError]       = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Step 1
  const [vrm,            setVrm]            = useState("");
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [vehicle,        setVehicle]        = useState<VehicleLookupSummary | null>(null);
  const [lookupError,    setLookupError]    = useState<string | null>(null);
  const [manualMode,     setManualMode]     = useState(false);
  const [manualMake,     setManualMake]     = useState("");
  const [manualModel,    setManualModel]    = useState("");
  const [manualYear,     setManualYear]     = useState("");

  // Step 2
  const [startAt,       setStartAt]       = useState("");
  const [endAt,         setEndAt]         = useState("");
  const [durationValue, setDurationValue] = useState("");
  const [durationUnit,  setDurationUnit]  = useState<DurationUnit>("days");
  const [coverChoice,   setCoverChoice]   = useState<CoverChoice>("1day");

  // Step 3
  const [customer, setCustomer] = useState<CustomerDetails>({
    fullName: "", dob: "", email: "", licenceType: "Full UK",
  });
  // Only used for age display — set onBlur so age never shows mid-entry
  const [committedDob, setCommittedDob] = useState("");

  // Step 4
  const [address, setAddress] = useState<AddressStructured>({
    line1: "", line2: "", town: "", county: "", postcode: "",
  });

  /* ── init ── */
  useEffect(() => {
    const start = getRoundedNow();
    setStartAt(start); setDurationValue("1"); setDurationUnit("days");
    setCoverChoice("1day"); setEndAt(calculateEndAt(start, "1", "days"));
    try {
      const existing = sessionStorage.getItem("coverza_quote_ref");
      if (existing) { setQuoteRef(existing); }
      else { const r = makeQuoteRef(); sessionStorage.setItem("coverza_quote_ref", r); setQuoteRef(r); }
      const rawDraft = sessionStorage.getItem("coverza_quote_draft");
      if (rawDraft) {
        const draft = JSON.parse(rawDraft);
        if (draft?.vrm)   setVrm(normaliseVrm(String(draft.vrm)));
        if (draft?.make)  setManualMake(String(draft.make));
        if (draft?.model) setManualModel(String(draft.model));
        if (draft?.year)  setManualYear(String(draft.year));
        if (draft?.make || draft?.model) setManualMode(true);
if (draft?.startAt) setStartAt(String(draft.startAt));
if (draft?.endAt) {
  setEndAt(String(draft.endAt));
  setCoverChoice("custom");
  // Restore stepper state if saved
  if (draft?.durationUnit) setDurationUnit(String(draft.durationUnit) as DurationUnit);
  if (draft?.durationValue) setDurationValue(String(draft.durationValue));
}
      }
    } catch { setQuoteRef(makeQuoteRef()); }
  }, []);

  // Keep endAt in sync for non-custom presets
  useEffect(() => {
    if (coverChoice === "custom") return;
    setEndAt(calculateEndAt(startAt, durationValue, durationUnit));
  }, [startAt, durationValue, durationUnit, coverChoice]);

  /* ── vehicle derived ── */
  const vrmDisplay   = useMemo(() => formatVrm(vrm), [vrm]);
  const lookupMake   = vehicle?.make   || "";
  const lookupModel  = vehicle?.model  || "";
  const lookupYear   = vehicle?.year ? String(vehicle.year) : "";
  const lookupColour = vehicle?.colour || "";
  const lookupFuel   = vehicle?.fuelType || "";
  const chosenMake   = manualMode ? manualMake.trim()  : lookupMake  || manualMake.trim();
  const chosenModel  = manualMode ? manualModel.trim() : lookupModel || manualModel.trim();
  const chosenYear   = manualMode ? manualYear.trim()  : lookupYear  || manualYear.trim();
  const vehicleTitle = [chosenMake, chosenModel].filter(Boolean).join(" ") || "Vehicle";

  const vehicleReady = useMemo(() => {
    const hasVrm     = vrm.length >= 5;
    const hasDetails = manualMode
      ? Boolean(manualMake.trim() && manualModel.trim())
      : Boolean(lookupMake || lookupModel || (manualMake.trim() && manualModel.trim()));
    return hasVrm && hasDetails;
  }, [vrm, manualMode, manualMake, manualModel, lookupMake, lookupModel]);

  /* ── cover derived ── */
  const startParts = useMemo(() => splitDTL(startAt), [startAt]);
  const endParts   = useMemo(() => splitDTL(endAt),   [endAt]);

  const durationMs = useMemo(() => {
    const s = parseDTL(startAt); const e = parseDTL(endAt);
    if (!s || !e) return 0;
    const ms = e.getTime() - s.getTime();
    return ms > 0 ? ms : 0;
  }, [startAt, endAt]);

  // Max allowed end = start + 12 months
  const maxEndAt = useMemo(() => startAt ? addMonthsToStart(startAt, 12) : "", [startAt]);

  const coverWithinLimit = useMemo(() => {
    if (!endAt || !maxEndAt) return false;
    const e = new Date(endAt).getTime(); const m = new Date(maxEndAt).getTime();
    return Number.isFinite(e) && Number.isFinite(m) && e <= m;
  }, [endAt, maxEndAt]);

  const coverReady = Boolean(startAt && endAt && durationMs > 0 && coverWithinLimit);

  const durationHours = useMemo(() => durationMs ? Math.ceil(durationMs / 3_600_000)  : 0, [durationMs]);
  const durationDays  = useMemo(() => durationMs ? Math.ceil(durationMs / 86_400_000) : 0, [durationMs]);

  /* ── pricing ──────────────────────────────────────────────────────────────
     Priority order:
     1. Preset "1month" tile   → always monthly billing (1 month)
     2. Custom window where coverChoice === "1month" not applicable,
        but span >= 1 whole calendar month → bill monthly (ceiling months)
     3. Short custom / preset:
        ≤ 12 hours  → hourly
        ≤ 6 days    → daily
        ≤ 4 weeks   → weekly
        else        → monthly (shouldn't reach here given limit above)
  ──────────────────────────────────────────────────────────────────────── */
const price = useMemo<PriceResult | null>(() => {
  if (!durationMs) return null;

  // Preset: 1 hour
  if (coverChoice === "1hour") {
    return {
      label: "Hourly",
      helper: "One hour of cover from your chosen start time.",
      unitLabel: "hour",
      units: 1,
      unitPrice: RATES.hour,
      total: RATES.hour,
      rateType: "hourly",
    };
  }

  // Preset: 1 day
  if (coverChoice === "1day") {
    return {
      label: "Daily",
      helper: "One full day of cover from your chosen start time.",
      unitLabel: "day",
      units: 1,
      unitPrice: RATES.day,
      total: RATES.day,
      rateType: "daily",
    };
  }

  // Preset: 1 week
  if (coverChoice === "1week") {
    return {
      label: "Weekly",
      helper: "One full week of cover from your chosen start time.",
      unitLabel: "week",
      units: 1,
      unitPrice: RATES.week,
      total: RATES.week,
      rateType: "weekly",
    };
  }

  // Preset: 1 month
  if (coverChoice === "1month") {
    return {
      label: "Monthly",
      helper: "One full calendar month of cover from your chosen start date.",
      unitLabel: "month",
      units: 1,
      unitPrice: RATES.month,
      total: RATES.month,
      rateType: "monthly",
    };
  }

  // Custom = always price by the chosen unit/value
  if (coverChoice === "custom") {
    const units = clampDuration(Number(durationValue) || 0, durationUnit);

    if (units <= 0) return null;

    if (durationUnit === "hours") {
      return {
        label: "Hourly",
        helper: "Billed per hour for your custom cover period.",
        unitLabel: "hour",
        units,
        unitPrice: RATES.hour,
        total: +(units * RATES.hour).toFixed(2),
        rateType: "hourly",
      };
    }

    if (durationUnit === "days") {
      return {
        label: "Daily",
        helper: "Billed per day for your custom cover period.",
        unitLabel: "day",
        units,
        unitPrice: RATES.day,
        total: +(units * RATES.day).toFixed(2),
        rateType: "daily",
      };
    }

    if (durationUnit === "weeks") {
      return {
        label: "Weekly",
        helper: "Billed per week for your custom cover period.",
        unitLabel: "week",
        units,
        unitPrice: RATES.week,
        total: +(units * RATES.week).toFixed(2),
        rateType: "weekly",
      };
    }

    if (durationUnit === "months") {
      return {
        label: "Monthly",
        helper: "Billed per month for your custom cover period.",
        unitLabel: "month",
        units,
        unitPrice: RATES.month,
        total: +(units * RATES.month).toFixed(2),
        rateType: "monthly",
      };
    }
  }

  return null;
}, [durationMs, coverChoice, durationUnit, durationValue]);

  /* ── driver derived ── */
  const dobAge   = useMemo(() => committedDob ? calcAgeDetailed(committedDob) : null, [committedDob]);
  const ageYears = useMemo(() => committedDob ? calcAge(committedDob) : null, [committedDob]);
  const driverReady = useMemo(() => Boolean(
    customer.fullName.trim().length >= 2 &&
    customer.dob && ageYears !== null && ageYears >= 17 &&
    validEmail(customer.email) && customer.licenceType
  ), [customer, ageYears]);

  /* ── address derived ── */
  const addressReady = useMemo(() => Boolean(
    address.line1.trim().length >= 4 &&
    address.town.trim().length >= 2 &&
    normalisePostcode(address.postcode).length >= 5
  ), [address]);

  const canCheckout = vehicleReady && coverReady && driverReady && addressReady && Boolean(price);

  /* ── navigation ── */
  function goToStep(step: Step) {
    setFormError(null); setActiveStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function continueFromStep() {
    if (activeStep === 1) {
      if (!vehicleReady) { setFormError("Enter your registration and confirm the vehicle details."); return; }
      goToStep(2);
    } else if (activeStep === 2) {
      if (!coverReady) { setFormError("Choose a valid cover period to continue."); return; }
      goToStep(3);
    } else if (activeStep === 3) {
      if (!driverReady) { setFormError("Complete all required fields to continue."); return; }
      goToStep(4);
    } else if (activeStep === 4) {
      if (!addressReady) { setFormError("Enter your full address to continue."); return; }
      goToStep(5);
    } else {
      onContinueToPayment();
    }
  }

  /* ── vehicle lookup ── */
  async function lookupVehicle(vrmOverride?: string) {
    const v = normaliseVrm(vrmOverride ?? vrm);
    if (v.length < 5 || loadingVehicle) return;
    setLoadingVehicle(true); setLookupError(null); setFormError(null); setVehicle(null);
    try {
      const res  = await fetch("/api/vehicle/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vrm: v }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Vehicle lookup failed.");
      const s = data?.summary ?? null; setVehicle(s);
      if (s?.make  && !manualMake)  setManualMake(String(s.make));
      if (s?.model && !manualModel) setManualModel(String(s.model));
      if (s?.year  && !manualYear)  setManualYear(String(s.year));
      if (!s?.make || !s?.model) setManualMode(true);
    } catch (e: any) {
      setLookupError(e?.message || "Vehicle lookup failed."); setManualMode(true);
    } finally { setLoadingVehicle(false); }
  }

  /* ── cover choice selection ── */
  function selectCoverChoice(next: CoverChoice) {
    setCoverChoice(next); setFormError(null);
    const s = getRoundedNow();
    setStartAt(s);
    if (next === "1hour") {
      setDurationValue("1"); setDurationUnit("hours");
      setEndAt(calculateEndAt(s, "1", "hours"));
    } else if (next === "1day") {
      setDurationValue("1"); setDurationUnit("days");
      setEndAt(calculateEndAt(s, "1", "days"));
    } else if (next === "1week") {
      setDurationValue("1"); setDurationUnit("weeks");
      setEndAt(calculateEndAt(s, "1", "weeks"));
    } else if (next === "1month") {
      // Exactly 1 calendar month from now — uses addMonthsToStart so
      // e.g. Jan 31 → Feb 28, Mar 31 → Apr 30, etc.
      setDurationValue("1"); setDurationUnit("months");
      setEndAt(addMonthsToStart(s, 1));
    } else if (next === "custom") {
      // Default custom to a 1-hour window as a starting point
      setDurationValue("1"); setDurationUnit("hours");
      setEndAt(calculateEndAt(s, "1", "hours"));
    }
  }


  /* ── checkout ── */
  async function onContinueToPayment() {
    setFormError(null);
    if (!canCheckout || !price) { setFormError("Please complete all steps before continuing."); return; }
    setCheckoutLoading(true);
    const ref      = quoteRef || makeQuoteRef();
    const cleanVrm = normaliseVrm(vrm);
    const addrStr  = buildAddressString(address);
    try {
sessionStorage.setItem("coverza_quote_draft", JSON.stringify({
  vrm: cleanVrm, make: chosenMake, model: chosenModel, year: chosenYear,
  startAt, endAt,
  durationUnit,   // add this
  durationValue,  // add this
  savedAt: new Date().toISOString(),
}));
      sessionStorage.setItem("coverza_checkout_payload", JSON.stringify({
        quoteRef: ref,
        quote: { vrm: cleanVrm, make: chosenMake, model: chosenModel, year: chosenYear, startAt, endAt, durationMs },
        customer: { ...customer, address: addrStr },
        pricing: { selectedLabel: price.label, units: price.units, unitLabel: price.unitLabel, unitPrice: price.unitPrice, total: price.total, rateCard: RATES },
        createdAt: new Date().toISOString(),
      }));
      sessionStorage.setItem("coverza_quote_ref", ref);
    } catch {}
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          quote: {
            vrm: cleanVrm, make: chosenMake, model: chosenModel, year: chosenYear,
            startAt: startAt, endAt: endAt,
            durationMs, totalAmountPence: Math.round(price.total * 100),
          },
          customer: {
            fullName: customer.fullName.trim(), dob: customer.dob,
            email: customer.email.trim(), licenceType: customer.licenceType, address: addrStr,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error || "Failed to start checkout.");
      window.location.href = data.url as string;
    } catch (err: any) {
      setCheckoutLoading(false);
      setFormError(err?.message || "Something went wrong. Please try again.");
    }
  }

  /* ── summary strings ── */
  const summaryVehicle = vrm
    ? `${formatVrm(vrm)}${chosenMake || chosenModel ? ` · ${vehicleTitle}` : ""}${chosenYear ? ` · ${chosenYear}` : ""}`
    : "Not added yet";
  const summaryCover = startAt && endAt
    ? `${prettyDateTime(startAt)} → ${prettyDateTime(endAt)}`
    : "Not selected yet";

  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <PageShell hideHero crumbs={[{ label: "Home", href: "/" }, { label: "Get quote" }]}>

      {/* ─────────────── PAGE HEADER ─────────────── */}
      <section className="pt-2 sm:pt-4 lg:pt-6">
        <div className="max-w-[68rem]">

          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.16)] bg-[rgba(108,76,243,0.05)] px-3.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.20em] text-[rgb(108,76,243)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
            Get a quote
          </div>

          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
            <div>
              <h1 className="max-w-[14ch] text-[2.5rem] font-extrabold leading-[0.9] tracking-[-0.065em] text-slate-950 sm:text-[3.5rem] lg:text-[4.4rem]">
                Cover in minutes,{" "}
                <span className="text-[rgb(108,76,243)]">not hours.</span>
              </h1>
              <p className="mt-4 max-w-[40rem] text-[0.95rem] leading-[1.85] text-slate-500">
                Five quick steps. Confirm your vehicle, set your cover window,
                add your details, then pay. Documents arrive the moment you check out.
              </p>
            </div>

            {/* Quote ref card */}
            <div className="relative overflow-hidden rounded-[1.75rem] bg-[rgb(108,76,243)] p-5 shadow-[0_20px_56px_rgba(108,76,243,0.25)]">
              <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/[0.08]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">Reference</p>
              <p className="mt-1 text-[1.45rem] font-extrabold tracking-tight !text-white">{quoteRef || "Creating…"}</p>
              <div className="mt-4 space-y-1.5">
                {["1 hour to 12 months cover", "Instant documents after payment", "No impact on no-claims"].map(t => (
                  <div key={t} className="flex items-center gap-2 text-[12px] text-white/65">
                    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <IconCheck className="h-2.5 w-2.5" />
                    </span>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <ProgressRail activeStep={activeStep} total={TOTAL_STEPS} />
          </div>
        </div>
      </section>

      {/* ─────────────── STEPS ─────────────── */}
      <section className="mt-8 max-w-[68rem] pb-4">

{/* ══════════════════ STEP 1 — Vehicle ══════════════════ */}
        {activeStep === 1 && (
          <StepShell
            step={1} total={TOTAL_STEPS}
            heading="What's the registration?"
            sub="Enter the reg and we'll look up the vehicle details automatically. If we can't find it, you can add the details manually."
            continueLabel="Continue"
            onContinue={continueFromStep}
          >
            <div>
              <p className="mb-6 text-[12px] text-slate-400">
                Fields marked <span className="text-red-400">*</span> are required.
              </p>
              <InputLabel>Registration number <span className="text-red-400">*</span></InputLabel>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  className="input flex-1 text-[1.2rem] font-extrabold uppercase tracking-[0.15em]"
                  placeholder="AB12 CDE"
                  value={vrmDisplay}
                  autoCapitalize="characters" autoCorrect="off" spellCheck={false}
                  onChange={e => { setVrm(normaliseVrm(e.target.value)); setVehicle(null); setLookupError(null); setFormError(null); }}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); lookupVehicle(vrm); } }}
                />
                <button type="button"
                  onClick={() => lookupVehicle(vrm)}
                  disabled={vrm.length < 5 || loadingVehicle}
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {loadingVehicle ? <><IconSpinner /> Checking…</> : "Check reg"}
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <InputHint>Press Enter or tap Check reg.</InputHint>
                <button type="button"
                  onClick={() => { setManualMode(v => !v); setFormError(null); }}
                  className="text-[12px] font-semibold text-[rgb(108,76,243)] underline-offset-4 hover:underline"
                >
                  {manualMode ? "Hide manual entry" : "Enter manually"}
                </button>
              </div>
            </div>

            {lookupError && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                <p className="text-[13px] font-semibold text-amber-800">Couldn't look this up automatically</p>
                <p className="mt-0.5 text-[13px] text-amber-700">{lookupError} Enter the details manually below.</p>
              </div>
            )}

            {vehicle && (
              <div className="mt-5 flex items-start justify-between gap-4 rounded-[1.5rem] border border-[rgba(108,76,243,0.12)] bg-[rgba(108,76,243,0.04)] p-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[rgb(108,76,243)]/60">Confirmed</p>
                  <p className="mt-1 text-[1rem] font-extrabold tracking-tight text-slate-950">
                    {[lookupMake, lookupModel].filter(Boolean).join(" ") || "Vehicle not found. Please enter details below!"}
                  </p>
                  {[lookupColour, lookupFuel, lookupYear].filter(Boolean).length > 0 && (
                    <p className="mt-0.5 text-[13px] text-slate-500">
                      {[lookupColour, lookupFuel, lookupYear].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgb(108,76,243)] text-white">
                  <IconCheck />
                </span>
              </div>
            )}

            {manualMode && (
              <div className="mt-5 rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-5">
                <p className="text-[12px] font-semibold text-slate-500">Make and model required — year optional.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <InputLabel htmlFor="make">Make</InputLabel>
                    <input id="make" className="input" placeholder="e.g. Toyota"
                      value={manualMake} onChange={e => { setManualMake(e.target.value); setFormError(null); }} />
                  </div>
                  <div>
                    <InputLabel htmlFor="model">Model</InputLabel>
                    <input id="model" className="input" placeholder="e.g. Yaris"
                      value={manualModel} onChange={e => { setManualModel(e.target.value); setFormError(null); }} />
                  </div>
                  <div>
                    <InputLabel htmlFor="year">Year</InputLabel>
                    <input id="year" className="input" placeholder="Optional" inputMode="numeric"
                      value={manualYear} onChange={e => { setManualYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4)); setFormError(null); }} />
                  </div>
                </div>
              </div>
            )}

            {formError && <div className="mt-4"><FieldError>{formError}</FieldError></div>}
          </StepShell>
        )}

        {/* ══════════════════ STEP 2 — Cover ══════════════════ */}
        {activeStep === 2 && (
          <StepShell
            step={2} total={TOTAL_STEPS}
            heading="How long do you need cover?"
            sub="Pick a preset or build a custom window. Cover runs from 1 hour up to 12 months."
            continueLabel="Continue"
            onContinue={continueFromStep}
            onBack={() => goToStep(1)}
          >
            {/* ── 5 cover tiles ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">

              {([
                {
                  key:   "1hour" as CoverChoice,
                  label: "1 hour",
                  sub:   "Quick cover for a short trip or errand",
                  Icon:  IconClock,
                },
                {
                  key:   "1day" as CoverChoice,
                  label: "1 day",
                  sub:   "Single trip, test drive or same-day use",
                  Icon:  IconCalendarDay,
                },
                {
                  key:   "1week" as CoverChoice,
                  label: "1 week",
                  sub:   "Flexibility across several days",
                  Icon:  IconCalendarWeek,
                },
                {
                  key:   "1month" as CoverChoice,
                  label: "1 month",
                  sub:   "Full calendar month from start date",
                  Icon:  IconCalendarMonth,
                },
                {
                  key:   "custom" as CoverChoice,
                  label: "Custom",
                  sub:   "Set your own precise start and end",
                  Icon:  IconSliders,
                },
              ] as { key: CoverChoice; label: string; sub: string; Icon: React.FC<{ className?: string }> }[]).map(({ key, label, sub, Icon }) => {
                const active = coverChoice === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectCoverChoice(key)}
                    className={[
                      "group relative rounded-[1.6rem] border p-5 text-left transition-all duration-200",
                      active
                        ? "border-[rgb(108,76,243)] bg-[rgb(108,76,243)] shadow-[0_12px_36px_rgba(108,76,243,0.24)]"
                        : "border-slate-200 bg-white hover:border-[rgba(108,76,243,0.30)] hover:shadow-[0_6px_20px_rgba(108,76,243,0.08)]",
                    ].join(" ")}
                  >
                    <span className={[
                      "mb-4 flex h-10 w-10 items-center justify-center rounded-[0.85rem] border transition-all",
                      active
                        ? "border-white/20 bg-white/15 text-white"
                        : "border-slate-200 bg-slate-50 text-[rgb(108,76,243)]",
                    ].join(" ")} aria-hidden="true">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className={["text-[1.05rem] font-extrabold tracking-tight", active ? "!text-white" : "text-slate-950"].join(" ")}>
                      {label}
                    </p>
                    <p className={["mt-1.5 text-[12px] leading-snug", active ? "!text-white/65" : "text-slate-500"].join(" ")}>
                      {sub}
                    </p>
                    {active && (
                      <span className="absolute bottom-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white">
                        <IconCheck className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── 1-hour clarification note ── */}
            {coverChoice === "1hour" && startAt && endAt && (
              <div className="mt-4 flex items-start gap-3 rounded-[1.25rem] border border-[rgba(108,76,243,0.12)] bg-[rgba(108,76,243,0.04)] px-4 py-4">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(108,76,243,0.15)] text-[rgb(108,76,243)]">
                  <IconCheck className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-slate-900">
                    Cover from <span className="text-[rgb(108,76,243)]">{prettyDateTime(startAt)}</span>{" "}
                    to <span className="text-[rgb(108,76,243)]">{prettyDateTime(endAt)}</span>
                  </p>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    One hour of cover. You can adjust the start time using Custom if needed.
                  </p>
                </div>
              </div>
            )}

            {/* ── 1-month clarification note ── */}
            {coverChoice === "1month" && startAt && endAt && (
              <div className="mt-4 flex items-start gap-3 rounded-[1.25rem] border border-[rgba(108,76,243,0.12)] bg-[rgba(108,76,243,0.04)] px-4 py-4">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(108,76,243,0.15)] text-[rgb(108,76,243)]">
                  <IconCheck className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-slate-900">
                    Cover from <span className="text-[rgb(108,76,243)]">{prettyDateTime(startAt)}</span>{" "}
                    to <span className="text-[rgb(108,76,243)]">{prettyDateTime(endAt)}</span>
                  </p>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    One full calendar month — end date respects the actual days in each month.
                  </p>
                </div>
              </div>
            )}

{coverChoice === "custom" && (
  <div className="mt-5 rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
    <p className="mb-5 text-[12.5px] font-semibold text-slate-500">
      Choose the unit, set how long you need, then pick your start date and time.
    </p>

    <div className="grid gap-4">

      {/* Row 1: Unit selector */}
      <div>
        <InputLabel>Cover unit</InputLabel>
        <div className="grid grid-cols-4 gap-2">
          {(["hours", "days", "weeks", "months"] as DurationUnit[]).map(u => (
            <button
              key={u}
              type="button"
              onClick={() => {
                const nextValue = String(clampDuration(Number(durationValue) || 1, u));
                setDurationUnit(u);
                setDurationValue(nextValue);
                setEndAt(calculateEndAt(startAt, nextValue, u));
                setFormError(null);
              }}
              className={[
                "rounded-[0.9rem] border py-2.5 text-[13px] font-semibold capitalize transition-all",
                durationUnit === u
                  ? "border-[rgb(108,76,243)] bg-[rgb(108,76,243)] !text-white shadow-[0_4px_14px_rgba(108,76,243,0.20)]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-[rgba(108,76,243,0.30)]",
              ].join(" ")}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Stepper with disabled states + singular/plural label */}
      <div>
        {(() => {
          const currentDuration = Number(durationValue) || 1;
          const atMin = currentDuration <= UNIT_CONFIG[durationUnit].min;
          const atMax = currentDuration >= UNIT_CONFIG[durationUnit].max;
          const durationUnitLabel = currentDuration === 1
            ? durationUnit.slice(0, -1)   // "hour", "day", "week", "month"
            : durationUnit;               // "hours", "days", "weeks", "months"

          return (
            <>
              <InputLabel>{UNIT_CONFIG[durationUnit].label} needed</InputLabel>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const next = String(clampDuration(currentDuration - 1, durationUnit));
                    setDurationValue(next);
                    setEndAt(calculateEndAt(startAt, next, durationUnit));
                    setFormError(null);
                  }}
                  disabled={atMin}
                  className={[
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-[20px] font-bold transition active:scale-95",
                    atMin
                      ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                      : "border-slate-200 bg-white text-slate-700 hover:border-[rgba(108,76,243,0.30)] hover:text-[rgb(108,76,243)]",
                  ].join(" ")}
                  aria-label="Decrease"
                >
                  −
                </button>

                <div className="flex-1 rounded-[0.9rem] border border-slate-200 bg-white px-4 py-3 text-center">
                  <span className="text-[1.5rem] font-extrabold tracking-tight text-slate-950">
                    {durationValue}
                  </span>
                  <span className="ml-1.5 text-[13px] font-semibold text-slate-400">
                    {durationUnitLabel}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = String(clampDuration(currentDuration + 1, durationUnit));
                    setDurationValue(next);
                    setEndAt(calculateEndAt(startAt, next, durationUnit));
                    setFormError(null);
                  }}
                  disabled={atMax}
                  className={[
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-[20px] font-bold transition active:scale-95",
                    atMax
                      ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                      : "border-slate-200 bg-white text-slate-700 hover:border-[rgba(108,76,243,0.30)] hover:text-[rgb(108,76,243)]",
                  ].join(" ")}
                  aria-label="Increase"
                >
                  +
                </button>
              </div>
              <p className="mt-1.5 text-center text-[11.5px] text-slate-400">
                Min {UNIT_CONFIG[durationUnit].min} · Max {UNIT_CONFIG[durationUnit].max}
              </p>
            </>
          );
        })()}
      </div>

      {/* Row 3: Start date + time */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <InputLabel>Start date</InputLabel>
          <input
            type="date"
            className="input block w-full text-[16px] [appearance:none]"
            value={startParts.date}
            onChange={(e) => {
              const next = joinDTL(e.target.value, startParts.time || "00:00");
              setStartAt(next);
              setEndAt(calculateEndAt(next, durationValue, durationUnit));
              setFormError(null);
            }}
          />
        </div>
        <div>
          <InputLabel>Start time</InputLabel>
          <input
            type="time"
            className="input block w-full text-[16px] [appearance:none]"
            value={startParts.time}
            onChange={(e) => {
              const next = joinDTL(startParts.date, e.target.value);
              setStartAt(next);
              setEndAt(calculateEndAt(next, durationValue, durationUnit));
              setFormError(null);
            }}
          />
        </div>
      </div>

    </div>

    {/* Summary preview with live price */}
    {startAt && endAt && durationMs > 0 && (
      <div className="mt-4 rounded-[1.1rem] border border-[rgba(108,76,243,0.12)] bg-white px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Cover window</p>
            <p className="mt-1 text-[13px] font-semibold text-slate-900">
              {prettyDateTime(startAt)}
            </p>
            <p className="text-[12px] text-slate-400">
              to {prettyDateTime(endAt)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="inline-block rounded-full bg-[rgba(108,76,243,0.08)] px-3 py-1.5 text-[13px] font-extrabold text-[rgb(108,76,243)]">
              {(() => {
                const n = Number(durationValue) || 1;
                const label = n === 1 ? durationUnit.slice(0, -1) : durationUnit;
                return `${n} ${label}`;
              })()}
            </span>
            {price && (
              <p className="mt-1.5 text-[15px] font-extrabold text-slate-950">
                {moneyGBP(price.total)}
              </p>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
)}

            {!coverWithinLimit && endAt && (
              <FieldError>Cover can't exceed 12 months. Please adjust your end date.</FieldError>
            )}
            {formError && <div className="mt-4"><FieldError>{formError}</FieldError></div>}
          </StepShell>
        )}

        {/* ══════════════════ STEP 3 — Driver details ══════════════════ */}
        {activeStep === 3 && (
          <StepShell
            step={3} total={TOTAL_STEPS}
            heading="Tell us about you"
            sub="Used for your quote confirmation and policy documents. Your name must match your driving licence."
            continueLabel="Continue"
            onContinue={continueFromStep}
            onBack={() => goToStep(2)}
          >
<div className="grid gap-6">
  <p className="text-[12px] text-slate-400">
    Fields marked <span className="text-red-400">*</span> are required.
  </p>
  <div>
    <InputLabel htmlFor="fullName">Full name <span className="text-red-400">*</span></InputLabel>
                <input id="fullName" className="input" placeholder="e.g. Jane Smith"
                  value={customer.fullName}
                  onChange={e => { setCustomer(c => ({ ...c, fullName: e.target.value })); setFormError(null); }} />
                <InputHint>Must match your driving licence exactly.</InputHint>
              </div>

              <div>
                <InputLabel htmlFor="dob">Date of birth <span className="text-red-400">*</span></InputLabel>
                <input id="dob" type="date" className="input block w-full text-[16px] [appearance:none]"
                  value={customer.dob}
                  onChange={e => { setCustomer(c => ({ ...c, dob: e.target.value })); setCommittedDob(""); setFormError(null); }}
                  onBlur={e => { if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) setCommittedDob(e.target.value); }} />
                {/* Age only shows after blur with a complete date — never mid-entry */}
                {!committedDob && !customer.dob && (
                  <InputHint>Used to confirm driver eligibility.</InputHint>
                )}
                {committedDob && (ageYears ?? 99) < 17 && (
                  <FieldError>You must be 17 or over to get cover.</FieldError>
                )}
                {committedDob && dobAge !== null && (ageYears ?? 0) >= 17 && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.18)] bg-[rgba(108,76,243,0.07)] px-3.5 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                    <span className="text-[13px] font-semibold text-[rgb(108,76,243)]">
                      {dobAge.years} years{dobAge.months > 0 ? `, ${dobAge.months} month${dobAge.months === 1 ? "" : "s"}` : ""} old
                    </span>
                  </div>
                )}
              </div>

              <div>
                <InputLabel htmlFor="email">Email address <span className="text-red-400">*</span></InputLabel>
                <input id="email" className="input" placeholder="name@email.com" inputMode="email"
                  value={customer.email}
                  onChange={e => { setCustomer(c => ({ ...c, email: e.target.value })); setFormError(null); }} />
                {customer.email && !validEmail(customer.email)
                  ? <FieldError>Enter a valid email address.</FieldError>
                  : <InputHint>Documents are emailed here immediately after payment.</InputHint>}
              </div>

              <div>
                <InputLabel htmlFor="licenceType">Licence type <span className="text-red-400">*</span></InputLabel>
                <select id="licenceType" className="input"
                  value={customer.licenceType}
                  onChange={e => { setCustomer(c => ({ ...c, licenceType: e.target.value as DrivingLicenceType })); setFormError(null); }}>
                  <option value="Full UK">Full UK licence</option>
                  <option value="International">International licence</option>
                  <option value="Learner">Learner licence</option>
                </select>
              </div>
            </div>

            {formError && <div className="mt-4"><FieldError>{formError}</FieldError></div>}
          </StepShell>
        )}

        {/* ══════════════════ STEP 4 — Address ══════════════════ */}

        {activeStep === 4 && (
          <StepShell
            step={4} total={TOTAL_STEPS}
            heading="What's your home address?"
            sub="Required for your policy documents."
            continueLabel="Review my quote"
            onContinue={continueFromStep}
            onBack={() => goToStep(3)}
          >
<div className="grid gap-5">
  <p className="text-[12px] text-slate-400">
    Fields marked <span className="text-red-400">*</span> are required.
  </p>
  <div>
    <InputLabel>Address line 1 <span className="text-red-400">*</span></InputLabel>
                <input className="input" placeholder="House number and street name"
                  value={address.line1}
                  onChange={e => { setAddress(a => ({ ...a, line1: e.target.value })); setFormError(null); }} />
              </div>
              <div>
                <InputLabel>Address line 2{" "}<span className="text-[12px] font-normal text-slate-400">(optional)</span></InputLabel>
                <input className="input" placeholder="Flat, apartment, etc."
                  value={address.line2}
                  onChange={e => { setAddress(a => ({ ...a, line2: e.target.value })); setFormError(null); }} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <InputLabel>Town / City <span className="text-red-400">*</span></InputLabel>
                  <input className="input" placeholder="Town or city"
                    value={address.town}
                    onChange={e => { setAddress(a => ({ ...a, town: e.target.value })); setFormError(null); }} />
                </div>
                <div>
                  <InputLabel>County{" "}<span className="text-[12px] font-normal text-slate-400">(optional)</span></InputLabel>
                  <input className="input" placeholder="County"
                    value={address.county}
                    onChange={e => { setAddress(a => ({ ...a, county: e.target.value })); setFormError(null); }} />
                </div>
              </div>
              <div className="sm:max-w-[240px]">
                <InputLabel>Postcode <span className="text-red-400">*</span></InputLabel>
                <input className="input uppercase" placeholder="e.g. SW1A 1AA"
                  value={address.postcode}
                  onChange={e => { setAddress(a => ({ ...a, postcode: normalisePostcode(e.target.value) })); setFormError(null); }} />
                <InputHint>Formatted automatically.</InputHint>
              </div>
            </div>

            {formError && <div className="mt-4"><FieldError>{formError}</FieldError></div>}
          </StepShell>
        )}

        {/* ══════════════════ STEP 5 — Review & pay ══════════════════ */}
        {activeStep === 5 && (
          <div className="relative overflow-hidden rounded-[2.25rem] border border-slate-200/70 bg-white shadow-[0_24px_80px_rgba(108,76,243,0.07),0_2px_8px_rgba(15,23,42,0.04)]">
            <div className="h-[3px] w-full bg-[rgb(108,76,243)]" />
            <div className="px-6 pb-8 pt-7 sm:px-10 sm:pb-10 sm:pt-8">

              <h2 className="text-[1.75rem] font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-[2.4rem]">
                Everything look right?
              </h2>
              <p className="mt-3 max-w-[38rem] text-[0.93rem] leading-[1.8] text-slate-500">
                Review your details below. Documents are emailed the moment checkout completes.
              </p>

              {/* Receipt table */}
              <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-slate-100">
                <div className="divide-y divide-slate-100">
                  {[
                    { label: "Vehicle",      value: summaryVehicle,                     step: 1 as Step },
                    { label: "Cover period", value: summaryCover,                       step: 2 as Step },
                    { label: "Driver",       value: customer.fullName.trim() || "—",    step: 3 as Step },
                    { label: "Address",      value: buildAddressString(address) || "—", step: 4 as Step },
                    { label: "Email",        value: customer.email.trim() || "—",       step: 3 as Step },
                  ].map(({ label, value, step }) => (
                    <div key={label} className="flex items-start justify-between gap-4 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">{label}</p>
                        <p className="mt-0.5 break-words text-[13.5px] font-semibold leading-snug text-slate-900">{value}</p>
                      </div>
                      <button type="button" onClick={() => goToStep(step)}
                        className="shrink-0 self-start rounded-full border border-slate-200 bg-white px-3 py-1 text-[11.5px] font-semibold text-slate-500 transition hover:border-[rgba(108,76,243,0.30)] hover:text-[rgb(108,76,243)]">
                        Edit
                      </button>
                    </div>
                  ))}
                </div>

                {/* Price footer */}
                <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Total due today</p>
                      {price && (
                        <p className="mt-1 text-[13px] text-slate-500">
                          {price.units} {price.unitLabel}{price.units === 1 ? "" : "s"} · {price.label.toLowerCase()} rate · inc. VAT
                        </p>
                      )}
                    </div>
                    <p className="text-[2.4rem] font-extrabold leading-none tracking-[-0.06em] text-slate-950">
                      {price ? moneyGBP(price.total) : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Process steps */}
              <div className="mt-6 overflow-hidden rounded-[1.4rem] border border-slate-100 bg-white">
                <div className="divide-y divide-slate-100">
                  {[
                    { n: "01", label: "Payment processed securely" },
                    { n: "02", label: "Policy created in your name" },
                    { n: "03", label: "Documents emailed instantly" },
                  ].map(({ n, label }) => (
                    <div key={n} className="flex items-center gap-4 px-5 py-3.5">
                      <span className="text-[11px] font-bold tabular-nums text-[rgb(108,76,243)]/50">{n}</span>
                      <span className="text-[13px] font-semibold text-slate-700">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-[13px] font-semibold text-red-700">Something needs attention</p>
                  <p className="mt-0.5 text-[13px] text-red-600">{formError}</p>
                </div>
              )}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button type="button"
                  onClick={onContinueToPayment}
                  disabled={!canCheckout || checkoutLoading}
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-[rgb(108,76,243)] px-8 text-[15px] font-semibold !text-white shadow-[0_12px_36px_rgba(108,76,243,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[rgb(96,66,225)] hover:shadow-[0_16px_44px_rgba(108,76,243,0.36)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
                >
                  {checkoutLoading
                    ? <><IconSpinner /> Processing…</>
                    : <>Pay {price ? moneyGBP(price.total) : "now"} <IconArrow /></>}
                </button>
                <button type="button" onClick={() => goToStep(4)}
                  className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-[15px] font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto">
                  Back
                </button>
              </div>

              <p className="mt-4 text-[11.5px] leading-6 text-slate-400">
                Stripe-secured payment · Documents issued immediately · Ref: {quoteRef}
              </p>
            </div>
          </div>
        )}

      </section>

      <div className="h-28 lg:hidden" aria-hidden="true" />

      <MobileStickyBar
        step={activeStep} total={TOTAL_STEPS} price={price}
        canContinue={
          activeStep === 1 ? vehicleReady
          : activeStep === 2 ? coverReady
          : activeStep === 3 ? driverReady
          : activeStep === 4 ? addressReady
          : canCheckout && !checkoutLoading
        }
        loading={checkoutLoading}
        onContinue={continueFromStep}
      />

    </PageShell>
  );
}