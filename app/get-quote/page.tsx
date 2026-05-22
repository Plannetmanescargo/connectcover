"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/site/PageShell";

/* =========================================================
   Types
========================================================= */
type Step = 1 | 2 | 3 | 4 | 5;
type DurationUnit = "hours" | "days" | "weeks" | "months";
type CoverChoice = "1day" | "2days" | "1week" | "custom";
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
};

/* =========================================================
   Constants
========================================================= */
const UNIT_CONFIG: Record<DurationUnit, { label: string; min: number; max: number; step: number }> = {
  hours:  { label: "Hours",  min: 1, max: 24, step: 1 },
  days:   { label: "Days",   min: 1, max: 31, step: 1 },
  weeks:  { label: "Weeks",  min: 1, max: 4,  step: 1 },
  months: { label: "Months", min: 1, max: 1,  step: 1 },
};
const RATES = { hour: 2.95, day: 19.99, week: 99.99, month: 149.99 } as const;

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
function IconCalendar({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4.5" width="14" height="13" rx="2.5" />
      <path d="M7 3v3m6-3v3M3 9.5h14" />
    </svg>
  );
}
function IconCalendarWeek({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4.5" width="14" height="13" rx="2.5" />
      <path d="M7 3v3m6-3v3M3 9.5h14M7 13h2m2 0h2" />
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
   Horizontal segmented bar. Each segment = one step.
   Completed = solid purple fill + label + tick.
   Active = purple outline + label highlighted.
   Upcoming = grey fill + muted label.
   On mobile collapses gracefully.
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
    <div className="select-none overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(108,76,243,0.06)]">
      {/* Top bar — filled segments */}
      <div className="flex h-1">
        {Array.from({ length: total }).map((_, i) => {
          const s = (i + 1) as Step;
          const done   = s < activeStep;
          const active = s === activeStep;
          return (
            <div
              key={s}
              className={[
                "flex-1 transition-all duration-500",
                i > 0 ? "border-l border-white/40" : "",
                done   ? "bg-[rgb(108,76,243)]"
                : active ? "bg-[rgb(108,76,243)]/40"
                : "bg-slate-100",
              ].join(" ")}
            />
          );
        })}
      </div>

      {/* Step labels row */}
      <div className="grid" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
        {Array.from({ length: total }).map((_, i) => {
          const s      = (i + 1) as Step;
          const done   = s < activeStep;
          const active = s === activeStep;
          const meta   = STEP_META[s];

          return (
            <div
              key={s}
              className={[
                "flex flex-col items-center gap-1.5 px-2 py-3.5 text-center",
                i > 0 ? "border-l border-slate-100" : "",
              ].join(" ")}
            >
              {/* Circle */}
              <span
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-all duration-300",
                  done   ? "border-[rgb(108,76,243)] bg-[rgb(108,76,243)] text-white"
                  : active ? "border-[rgb(108,76,243)] bg-white text-[rgb(108,76,243)] shadow-[0_0_0_3px_rgba(108,76,243,0.12)]"
                  : "border-slate-200 bg-white text-slate-400",
                ].join(" ")}
              >
                {done ? <IconCheck className="h-3.5 w-3.5" /> : s}
              </span>

              {/* Label — hidden on very small screens, short label on sm, long on md+ */}
              <span
                className={[
                  "hidden text-[11px] font-semibold leading-tight tracking-[-0.01em] sm:block",
                  active   ? "text-slate-950"
                  : done   ? "text-[rgb(108,76,243)]"
                  : "text-slate-400",
                ].join(" ")}
              >
                <span className="sm:hidden md:hidden">{meta.short}</span>
                <span className="hidden sm:inline md:hidden">{meta.short}</span>
                <span className="hidden md:inline">{meta.long}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   STEP SHELL
   Consistent card wrapper every step lives inside.
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
      {/* Purple top rule */}
      <div className="h-[3px] w-full bg-[rgb(108,76,243)]" />

      <div className="px-6 pb-8 pt-7 sm:px-10 sm:pb-10 sm:pt-8">
        {/* Heading */}
        <h2 className="text-[1.75rem] font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-[2.4rem]">
          {heading}
        </h2>
        {sub && (
          <p className="mt-3 max-w-[38rem] text-[0.93rem] leading-[1.8] text-slate-500">
            {sub}
          </p>
        )}

        {/* Content */}
        <div className="mt-8">{children}</div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onContinue}
            disabled={continueDisabled || continueLoading}
            className="inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-[rgb(108,76,243)] px-8 text-[15px] font-semibold !text-white shadow-[0_12px_36px_rgba(108,76,243,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[rgb(96,66,225)] hover:shadow-[0_16px_44px_rgba(108,76,243,0.36)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[0_12px_36px_rgba(108,76,243,0.28)] sm:w-auto"
          >
            {continueLoading ? (
              <><IconSpinner /> Processing…</>
            ) : (
              <>{continueLabel} <IconArrow /></>
            )}
          </button>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-[15px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98] sm:w-auto"
            >
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
          {/* Left: step count + context */}
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
              <p className="text-[13px] font-semibold text-slate-700">
                {STEP_META[step]?.long ?? ""}
              </p>
            )}
          </div>

          {/* CTA */}
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

  /* core */
  const [activeStep,        setActiveStep]        = useState<Step>(1);
  const [quoteRef,          setQuoteRef]          = useState("");
  const [formError,         setFormError]         = useState<string | null>(null);
  const [checkoutLoading,   setCheckoutLoading]   = useState(false);

  /* step 1 */
  const [vrm,            setVrm]            = useState("");
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [vehicle,        setVehicle]        = useState<VehicleLookupSummary | null>(null);
  const [lookupError,    setLookupError]    = useState<string | null>(null);
  const [manualMode,     setManualMode]     = useState(false);
  const [manualMake,     setManualMake]     = useState("");
  const [manualModel,    setManualModel]    = useState("");
  const [manualYear,     setManualYear]     = useState("");

  /* step 2 */
  const [startAt,       setStartAt]       = useState("");
  const [endAt,         setEndAt]         = useState("");
  const [durationValue, setDurationValue] = useState("");
  const [durationUnit,  setDurationUnit]  = useState<DurationUnit>("days");
  const [coverChoice,   setCoverChoice]   = useState<CoverChoice>("1day");

  /* step 3 — driver */
  const [customer, setCustomer] = useState<CustomerDetails>({
    fullName: "", dob: "", email: "", licenceType: "Full UK",
  });

  /* step 4 — address */
  const [address, setAddress] = useState<AddressStructured>({
    line1: "", line2: "", town: "", county: "", postcode: "",
  });

  /* init */
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
        if (draft?.endAt) { setEndAt(String(draft.endAt)); setCoverChoice("custom"); }
      }
    } catch { setQuoteRef(makeQuoteRef()); }
  }, []);

  useEffect(() => {
    if (coverChoice === "custom") return;
    setEndAt(calculateEndAt(startAt, durationValue, durationUnit));
  }, [startAt, durationValue, durationUnit, coverChoice]);

  /* derived — vehicle */
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

  /* derived — cover */
  const startParts = useMemo(() => splitDTL(startAt), [startAt]);
  const endParts   = useMemo(() => splitDTL(endAt),   [endAt]);

  const durationMs = useMemo(() => {
    const s = parseDTL(startAt); const e = parseDTL(endAt);
    if (!s || !e) return 0;
    const ms = e.getTime() - s.getTime();
    return ms > 0 ? ms : 0;
  }, [startAt, endAt]);

  const maxEndAt = useMemo(() => startAt ? addMonthsToStart(startAt, 1) : "", [startAt]);
  const coverWithinOneMonth = useMemo(() => {
    if (!endAt || !maxEndAt) return false;
    const e = new Date(endAt).getTime(); const m = new Date(maxEndAt).getTime();
    return Number.isFinite(e) && Number.isFinite(m) && e <= m;
  }, [endAt, maxEndAt]);
  const coverReady = Boolean(startAt && endAt && durationMs > 0 && coverWithinOneMonth);

  const durationHours = useMemo(() => durationMs ? Math.ceil(durationMs / 3_600_000)  : 0, [durationMs]);
  const durationDays  = useMemo(() => durationMs ? Math.ceil(durationMs / 86_400_000) : 0, [durationMs]);

  const isCalendarMonthCover = useMemo(() => {
    if (!startAt || !endAt) return false;
    return endAt === addMonthsToStart(startAt, 1);
  }, [startAt, endAt]);

  const price = useMemo<PriceResult | null>(() => {
    if (!durationMs) return null;
    if (durationUnit === "months" || isCalendarMonthCover) {
      return { label: "Monthly", helper: "One full calendar month of cover.", unitLabel: "month", units: 1, unitPrice: RATES.month, total: RATES.month };
    }
    if (durationHours <= 12) {
      const u = Math.max(durationHours, 1);
      return { label: "Hourly", helper: "Billed per hour — ideal for short trips.", unitLabel: "hour", units: u, unitPrice: RATES.hour, total: +(u * RATES.hour).toFixed(2) };
    }
    if (durationDays <= 6) {
      const u = Math.max(durationDays, 1);
      return { label: "Daily", helper: "Daily rate — great for same-day or overnight cover.", unitLabel: "day", units: u, unitPrice: RATES.day, total: +(u * RATES.day).toFixed(2) };
    }
    const u = Math.ceil(durationDays / 7);
    return { label: "Weekly", helper: "Weekly rate — better value for longer periods.", unitLabel: "week", units: u, unitPrice: RATES.week, total: +(u * RATES.week).toFixed(2) };
  }, [durationMs, durationHours, durationDays, durationUnit, isCalendarMonthCover]);

  /* derived — driver */
  const dobAge   = useMemo(() => customer.dob ? calcAgeDetailed(customer.dob) : null, [customer.dob]);
  const ageYears = useMemo(() => customer.dob ? calcAge(customer.dob) : null, [customer.dob]);
  const driverReady = useMemo(() => Boolean(
    customer.fullName.trim().length >= 2 &&
    customer.dob && ageYears !== null && ageYears >= 17 &&
    validEmail(customer.email) && customer.licenceType
  ), [customer, ageYears]);

  /* derived — address */
  const addressReady = useMemo(() => Boolean(
    address.line1.trim().length >= 4 &&
    address.town.trim().length >= 2 &&
    normalisePostcode(address.postcode).length >= 5
  ), [address]);

  const canCheckout = vehicleReady && coverReady && driverReady && addressReady && Boolean(price);

  /* navigation */
  function goToStep(step: Step) {
    setFormError(null); setActiveStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function continueFromStep() {
    if (activeStep === 1) {
      if (!vehicleReady) { setFormError("Enter your registration and confirm the vehicle details."); return; }
      goToStep(2);
    } else if (activeStep === 2) {
      if (!coverReady) { setFormError("Choose a valid cover period between 1 hour and 1 month."); return; }
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

  /* vehicle lookup */
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

  /* cover choice */
  function selectCoverChoice(next: CoverChoice) {
    setCoverChoice(next); setFormError(null);
    if (next === "custom") { if (!startAt) { const s = getRoundedNow(); setStartAt(s); setEndAt(calculateEndAt(s, "1", "hours")); } return; }
    const s = getRoundedNow(); setStartAt(s);
    if (next === "1day")  { setDurationValue("1"); setDurationUnit("days");  setEndAt(calculateEndAt(s, "1", "days")); }
    if (next === "2days") { setDurationValue("2"); setDurationUnit("days");  setEndAt(calculateEndAt(s, "2", "days")); }
    if (next === "1week") { setDurationValue("1"); setDurationUnit("weeks"); setEndAt(calculateEndAt(s, "1", "weeks")); }
  }
  function updateCustomStart(date: string, time: string) {
    const next = joinDTL(date, time); setStartAt(next); setFormError(null);
    if (next && (!endAt || new Date(endAt) <= new Date(next))) setEndAt(calculateEndAt(next, "1", "hours"));
  }
  function updateCustomEnd(date: string, time: string) { setEndAt(joinDTL(date, time)); setFormError(null); }

  /* checkout */
  async function onContinueToPayment() {
    setFormError(null);
    if (!canCheckout || !price) { setFormError("Please complete all steps before continuing."); return; }
    setCheckoutLoading(true);
    const ref      = quoteRef || makeQuoteRef();
    const cleanVrm = normaliseVrm(vrm);
    const addrStr  = buildAddressString(address);
    try {
      sessionStorage.setItem("coverza_quote_draft", JSON.stringify({ vrm: cleanVrm, make: chosenMake, model: chosenModel, year: chosenYear, startAt, endAt, savedAt: new Date().toISOString() }));
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
          quote:    { vrm: cleanVrm, make: chosenMake, model: chosenModel, year: chosenYear, startAt: new Date(startAt).toISOString(), endAt: new Date(endAt).toISOString(), durationMs, totalAmountPence: Math.round(price.total * 100) },
          customer: { fullName: customer.fullName.trim(), dob: customer.dob, email: customer.email.trim(), licenceType: customer.licenceType, address: addrStr },
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

  /* summary strings */
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
                {[
                  "1 hour to 1 month cover",
                  "Instant documents after payment",
                  "No impact on no-claims",
                ].map(t => (
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

          {/* ── PROGRESS RAIL ── */}
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
              <InputLabel>Registration number</InputLabel>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  className="input flex-1 text-[1.2rem] font-extrabold uppercase tracking-[0.15em]"
                  placeholder="AB12 CDE"
                  value={vrmDisplay}
                  autoCapitalize="characters" autoCorrect="off" spellCheck={false}
                  onChange={e => { setVrm(normaliseVrm(e.target.value)); setVehicle(null); setLookupError(null); setFormError(null); }}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); lookupVehicle(vrm); } }}
                />
                <button
                  type="button"
                  onClick={() => lookupVehicle(vrm)}
                  disabled={vrm.length < 5 || loadingVehicle}
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {loadingVehicle ? <><IconSpinner /> Checking…</> : "Check reg"}
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <InputHint>Press Enter or tap Check reg.</InputHint>
                <button
                  type="button"
                  onClick={() => { setManualMode(v => !v); setFormError(null); }}
                  className="text-[12px] font-semibold text-[rgb(108,76,243)] underline-offset-4 hover:underline"
                >
                  {manualMode ? "Hide manual entry" : "Enter manually"}
                </button>
              </div>
            </div>

            {/* Lookup error */}
            {lookupError && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                <p className="text-[13px] font-semibold text-amber-800">Couldn't look this up automatically</p>
                <p className="mt-0.5 text-[13px] text-amber-700">{lookupError} Enter the details manually below.</p>
              </div>
            )}

            {/* Vehicle confirmed */}
            {vehicle && (
              <div className="mt-5 flex items-start justify-between gap-4 rounded-[1.5rem] border border-[rgba(108,76,243,0.12)] bg-[rgba(108,76,243,0.04)] p-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[rgb(108,76,243)]/60">Confirmed</p>
                  <p className="mt-1 text-[1rem] font-extrabold tracking-tight text-slate-950">
                    {[lookupMake, lookupModel].filter(Boolean).join(" ") || "Vehicle found"}
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

            {/* Manual entry */}
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
            sub="Pick a preset or build a custom window. Minimum 1 hour, maximum 1 calendar month."
            continueLabel="Continue"
            onContinue={continueFromStep}
            onBack={() => goToStep(1)}
          >
            {/* ── Cover tiles ── */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {([
                {
                  key:     "1day" as CoverChoice,
                  label:   "1 day",
                  sub:     "Ideal for a single trip, test drive or same-day use",
                  Icon:    IconClock,
                },
                {
                  key:     "2days" as CoverChoice,
                  label:   "2 days",
                  sub:     "Perfect for a weekend away or a short collection",
                  Icon:    IconCalendar,
                },
                {
                  key:     "1week" as CoverChoice,
                  label:   "1 week",
                  sub:     "More flexibility when you need cover across several days",
                  Icon:    IconCalendarWeek,
                },
                {
                  key:     "custom" as CoverChoice,
                  label:   "Custom",
                  sub:     "Set your own precise start date, time and duration",
                  Icon:    IconSliders,
                },
              ]).map(({ key, label, sub, Icon }) => {
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
                    {/* Icon container */}
                    <span
                      className={[
                        "mb-4 flex h-10 w-10 items-center justify-center rounded-[0.85rem] border transition-all",
                        active
                          ? "border-white/20 bg-white/15 text-white"
                          : "border-slate-200 bg-slate-50 text-[rgb(108,76,243)]",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      <Icon className="h-5 w-5" />
                    </span>

                    {/* Label */}
                    <p className={["text-[1.05rem] font-extrabold tracking-tight", active ? "!text-white" : "text-slate-950"].join(" ")}>
                      {label}
                    </p>

                    {/* Sub */}
                    <p className={["mt-1.5 text-[12.5px] leading-snug", active ? "!text-white/65" : "text-slate-500"].join(" ")}>
                      {sub}
                    </p>

                    {/* Active indicator — bottom right tick */}
                    {active && (
                      <span className="absolute bottom-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white">
                        <IconCheck className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom date pickers */}
            {coverChoice === "custom" && (
              <div className="mt-5 rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-5">
                <p className="mb-4 text-[12.5px] font-semibold text-slate-500">Set your exact start and end date and time.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <InputLabel>Start date</InputLabel>
                    <input type="date" className="input block w-full text-[16px] [appearance:none]"
                      value={startParts.date} onChange={e => updateCustomStart(e.target.value, startParts.time || "00:00")} />
                  </div>
                  <div>
                    <InputLabel>Start time</InputLabel>
                    <input type="time" className="input block w-full text-[16px] [appearance:none]"
                      value={startParts.time} onChange={e => updateCustomStart(startParts.date, e.target.value)} />
                  </div>
                  <div>
                    <InputLabel>End date</InputLabel>
                    <input type="date" className="input block w-full text-[16px] [appearance:none]"
                      value={endParts.date} onChange={e => updateCustomEnd(e.target.value, endParts.time || "00:00")} />
                  </div>
                  <div>
                    <InputLabel>End time</InputLabel>
                    <input type="time" className="input block w-full text-[16px] [appearance:none]"
                      value={endParts.time} onChange={e => updateCustomEnd(endParts.date, e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Cover summary — only once dates are valid */}
            {durationMs > 0 && coverWithinOneMonth && (
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[1.25rem] border border-slate-100 bg-white px-5 py-4">
                <div className="text-[13px]">
                  <span className="text-slate-400">Starts </span>
                  <span className="font-semibold text-slate-900">{prettyDateTime(startAt)}</span>
                </div>
                <span className="text-slate-200" aria-hidden="true">→</span>
                <div className="text-[13px]">
                  <span className="text-slate-400">Ends </span>
                  <span className="font-semibold text-slate-900">{prettyDateTime(endAt)}</span>
                </div>
                <div className="ml-auto">
                  <span className="rounded-full bg-[rgba(108,76,243,0.08)] px-3 py-1 text-[13px] font-extrabold text-[rgb(108,76,243)]">
                    {formatDurationFromMs(durationMs)}
                  </span>
                </div>
              </div>
            )}

            {!coverWithinOneMonth && endAt && (
              <FieldError>Cover can't exceed 1 calendar month. Please adjust your end date.</FieldError>
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

              {/* Full name */}
              <div>
                <InputLabel htmlFor="fullName">Full name</InputLabel>
                <input id="fullName" className="input" placeholder="e.g. Jane Smith"
                  value={customer.fullName}
                  onChange={e => { setCustomer(c => ({ ...c, fullName: e.target.value })); setFormError(null); }} />
                <InputHint>Must match your driving licence exactly.</InputHint>
              </div>

              {/* Date of birth with live age badge */}
              <div>
                <InputLabel htmlFor="dob">Date of birth</InputLabel>
                <input
                  id="dob"
                  type="date"
                  className="input block w-full text-[16px] [appearance:none]"
                  value={customer.dob}
                  onChange={e => { setCustomer(c => ({ ...c, dob: e.target.value })); setFormError(null); }}
                />

                {/* Live age — visible purple badge, not a hint */}
                {customer.dob && dobAge !== null && (ageYears ?? 0) >= 17 && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.18)] bg-[rgba(108,76,243,0.07)] px-3.5 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                    <span className="text-[13px] font-semibold text-[rgb(108,76,243)]">
                      {dobAge.years} years{dobAge.months > 0 ? `, ${dobAge.months} month${dobAge.months === 1 ? "" : "s"}` : ""} old
                    </span>
                  </div>
                )}

                {/* Under 17 error */}
                {customer.dob && (ageYears ?? 99) < 17 && (
                  <FieldError>You must be 17 or over to get cover.</FieldError>
                )}

                {/* No dob entered yet */}
                {!customer.dob && (
                  <InputHint>Used to confirm driver eligibility.</InputHint>
                )}
              </div>

              {/* Email */}
              <div>
                <InputLabel htmlFor="email">Email address</InputLabel>
                <input id="email" className="input" placeholder="name@email.com" inputMode="email"
                  value={customer.email}
                  onChange={e => { setCustomer(c => ({ ...c, email: e.target.value })); setFormError(null); }} />
                {customer.email && !validEmail(customer.email)
                  ? <FieldError>Enter a valid email address.</FieldError>
                  : <InputHint>Documents are emailed here immediately after payment.</InputHint>}
              </div>

              {/* Licence type */}
              <div>
                <InputLabel htmlFor="licenceType">Licence type</InputLabel>
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
              <div>
                <InputLabel>Address line 1</InputLabel>
                <input className="input" placeholder="House number and street name"
                  value={address.line1}
                  onChange={e => { setAddress(a => ({ ...a, line1: e.target.value })); setFormError(null); }} />
              </div>
              <div>
                <InputLabel>
                  Address line 2{" "}
                  <span className="text-[12px] font-normal text-slate-400">(optional)</span>
                </InputLabel>
                <input className="input" placeholder="Flat, apartment, etc."
                  value={address.line2}
                  onChange={e => { setAddress(a => ({ ...a, line2: e.target.value })); setFormError(null); }} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <InputLabel>Town / City</InputLabel>
                  <input className="input" placeholder="Town or city"
                    value={address.town}
                    onChange={e => { setAddress(a => ({ ...a, town: e.target.value })); setFormError(null); }} />
                </div>
                <div>
                  <InputLabel>
                    County{" "}
                    <span className="text-[12px] font-normal text-slate-400">(optional)</span>
                  </InputLabel>
                  <input className="input" placeholder="County"
                    value={address.county}
                    onChange={e => { setAddress(a => ({ ...a, county: e.target.value })); setFormError(null); }} />
                </div>
              </div>
              <div className="sm:max-w-[240px]">
                <InputLabel>Postcode</InputLabel>
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
                Review your details below. Your documents are emailed the moment checkout completes.
              </p>

              {/* ── Receipt-style summary table ── */}
              <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-slate-100">

                {/* Line items */}
                <div className="divide-y divide-slate-100">
                  {[
                    { label: "Vehicle",      value: summaryVehicle,                          step: 1 as Step },
                    { label: "Cover period", value: summaryCover,                            step: 2 as Step },
                    { label: "Driver",       value: customer.fullName.trim() || "—",         step: 3 as Step },
                    { label: "Address",      value: buildAddressString(address) || "—",      step: 4 as Step },
                    { label: "Email",        value: customer.email.trim() || "—",            step: 3 as Step },
                  ].map(({ label, value, step }) => (
                    <div key={label} className="flex items-start justify-between gap-4 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">{label}</p>
                        <p className="mt-0.5 break-words text-[13.5px] font-semibold leading-snug text-slate-900">{value}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => goToStep(step)}
                        className="shrink-0 self-start rounded-full border border-slate-200 bg-white px-3 py-1 text-[11.5px] font-semibold text-slate-500 transition hover:border-[rgba(108,76,243,0.30)] hover:text-[rgb(108,76,243)]"
                      >
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
                          {price.units} {price.unitLabel}{price.units === 1 ? "" : "s"} ·{" "}
                          {price.label.toLowerCase()} rate · inc. VAT
                        </p>
                      )}
                    </div>
                    <p className="text-[2.4rem] font-extrabold leading-none tracking-[-0.06em] text-slate-950">
                      {price ? moneyGBP(price.total) : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Process steps — clean text rows ── */}
              <div className="mt-6 rounded-[1.4rem] border border-slate-100 bg-white">
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

              {/* Error */}
              {formError && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-[13px] font-semibold text-red-700">Something needs attention</p>
                  <p className="mt-0.5 text-[13px] text-red-600">{formError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={onContinueToPayment}
                  disabled={!canCheckout || checkoutLoading}
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-[rgb(108,76,243)] px-8 text-[15px] font-semibold !text-white shadow-[0_12px_36px_rgba(108,76,243,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[rgb(96,66,225)] hover:shadow-[0_16px_44px_rgba(108,76,243,0.36)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
                >
                  {checkoutLoading
                    ? <><IconSpinner /> Processing…</>
                    : <>Pay {price ? moneyGBP(price.total) : "now"} <IconArrow /></>}
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(4)}
                  className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-[15px] font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto"
                >
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

      {/* Mobile spacer */}
      <div className="h-28 lg:hidden" aria-hidden="true" />

      {/* ── Mobile sticky bar ── */}
      <MobileStickyBar
        step={activeStep}
        total={TOTAL_STEPS}
        price={price}
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
