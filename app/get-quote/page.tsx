"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/site/PageShell";

/* =========================================================
   Types
========================================================= */

type QuoteDraft = {
  vrm: string;
  make: string;
  model: string;
  year: string;
  startAt: string;
  endAt: string;
  savedAt?: string;
};

type DrivingLicenceType = "UK" | "International" | "Learner";

type AddressStructured = {
  line1: string;
  line2: string;
  town: string;
  county: string;
  postcode: string;
};

type CustomerDetails = {
  fullName: string;
  dob: string;
  email: string;
  licenceType: DrivingLicenceType;
  address: string;
};

type PriceOptionKey = "hour" | "day" | "week" | "month";

type PriceOption = {
  key: PriceOptionKey;
  label: string;
  helper: string;
  unitLabel: string;
  unitPrice: number;
  units: number;
  total: number;
};

const RATES = {
  hour: 1.99,
  day: 24.99,
  week: 149.99,
  month: 290.0,
} as const;

/* =========================================================
   Helpers
========================================================= */

function moneyGBP(n: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(n);
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function parseDateTimeLocal(dt: string) {
  const d = new Date(dt);
  return Number.isNaN(d.getTime()) ? null : d;
}

function prettyDateTime(dt: string) {
  if (!dt) return "";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt.replace("T", " ");
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function clampMin(n: number, min: number) {
  return n < min ? min : n;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toDatetimeLocalValue(d: Date) {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function calcAge(dobISO: string) {
  if (!dobISO) return null;
  const dob = new Date(dobISO);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

function makeQuoteRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "CC-";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function normalisePostcode(pc: string) {
  return pc.toUpperCase().replace(/\s+/g, " ").trim();
}

function buildAddressString(a: AddressStructured) {
  const parts = [
    a.line1.trim(),
    a.line2.trim(),
    a.town.trim(),
    a.county.trim(),
    normalisePostcode(a.postcode),
  ].filter(Boolean);
  return parts.join(", ");
}

/* =========================================================
   UI bits
========================================================= */

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700">
      {children}
    </span>
  );
}

function SectionIntro({
  eyebrow,
  title,
  copy,
  wide = false,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  wide?: boolean;
}) {
  return (
    <div className="max-w-[60rem]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)]">
        {eyebrow}
      </div>

      <h2
        className={[
          "mt-4 text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl",
          wide
            ? "max-w-[20ch] lg:max-w-[18ch] lg:text-[4rem]"
            : "max-w-[15ch] lg:max-w-[13ch] lg:text-[3.85rem]",
        ].join(" ")}
      >
        {title}
      </h2>

      {copy ? (
        <p className="mt-4 max-w-[46rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
          {copy}
        </p>
      ) : null}
    </div>
  );
}

function ProgressRail({
  active,
}: {
  active: 1 | 2 | 3;
}) {
  const items = [
    { n: 1, label: "Review cover" },
    { n: 2, label: "Confirm details" },
    { n: 3, label: "Secure checkout" },
  ] as const;

  return (
    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/86 p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
        {items.map((item, idx) => (
          <div key={item.n} className={idx === items.length - 1 ? "" : "contents"}>
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={[
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-extrabold transition",
                  item.n < active
                    ? "border-[rgba(108,76,243,0.18)] bg-[rgba(108,76,243,0.10)] text-[rgb(108,76,243)]"
                    : item.n === active
                    ? "border-[rgb(108,76,243)] bg-[rgb(108,76,243)] text-white"
                    : "border-slate-200 bg-white text-slate-400",
                ].join(" ")}
              >
                {item.n < active ? "✓" : item.n}
              </span>

              <div className="min-w-0">
                <div
                  className={[
                    "text-[11px] font-semibold uppercase tracking-[0.16em]",
                    item.n <= active ? "text-slate-900" : "text-slate-500",
                  ].join(" ")}
                >
                  {item.label}
                </div>
              </div>
            </div>

            {idx < items.length - 1 ? (
              <div className="hidden h-px w-10 bg-slate-200 md:block" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/84 px-4 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div
        className={[
          "mt-2 break-words",
          strong
            ? "text-[1.05rem] font-extrabold tracking-tight text-slate-950"
            : "text-sm font-semibold text-slate-950",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function AssuranceRow({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-slate-600">
      {items.map((item) => (
        <div key={item} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function PriceCard({
  option,
  isSelected,
  isBest,
  onSelect,
}: {
  option: PriceOption;
  isSelected: boolean;
  isBest: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={[
        "relative rounded-[1.55rem] border p-6 text-left transition-all duration-200",
        isSelected
          ? "border-[rgba(108,76,243,0.18)] bg-[linear-gradient(180deg,rgba(248,245,255,0.92),rgba(255,255,255,0.98))] shadow-[0_12px_32px_rgba(108,76,243,0.08)]"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[1.02rem] font-extrabold tracking-[-0.02em] text-slate-950">
              {option.label}
            </div>

            {isBest ? (
              <span className="inline-flex items-center rounded-full border border-[rgba(108,76,243,0.14)] bg-[rgba(108,76,243,0.08)] px-2 py-0.5 text-[11px] font-extrabold text-[rgb(108,76,243)]">
                Best value
              </span>
            ) : null}

            {isSelected ? (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-extrabold text-slate-700">
                Selected
              </span>
            ) : null}
          </div>

          <div className="mt-2 text-[13px] leading-6 text-slate-600">
            {option.helper}
          </div>

          <div className="mt-4 text-[13px] text-slate-600">
            <span className="font-semibold text-slate-900">{option.units}</span>{" "}
            {option.unitLabel}
            {option.units === 1 ? "" : "s"} •{" "}
            <span className="font-semibold text-slate-900">
              {moneyGBP(option.unitPrice)}
            </span>{" "}
            / {option.unitLabel}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[2rem] font-extrabold tracking-tight text-slate-950">
            {moneyGBP(option.total)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">VAT included</div>
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   Page
========================================================= */

export default function GetQuotePage() {
  const [draft, setDraft] = useState<QuoteDraft | null>(null);
  const [quoteRef, setQuoteRef] = useState("");
  const [editingDates, setEditingDates] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PriceOptionKey | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [address, setAddress] = useState<AddressStructured>({
    line1: "",
    line2: "",
    town: "",
    county: "",
    postcode: "",
  });

  const [customer, setCustomer] = useState<CustomerDetails>({
    fullName: "",
    dob: "",
    email: "",
    licenceType: "UK",
    address: "",
  });

  const detailsRef = useRef<HTMLDivElement | null>(null);
  const pricingRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("gtc_quote_draft");
      if (raw) setDraft(JSON.parse(raw) as QuoteDraft);

      const existingRef = sessionStorage.getItem("gtc_quote_ref");
      if (existingRef) setQuoteRef(existingRef);
      else {
        const ref = makeQuoteRef();
        sessionStorage.setItem("gtc_quote_ref", ref);
        setQuoteRef(ref);
      }
    } catch {
      setDraft(null);
    }
  }, []);

  useEffect(() => {
    const addr = buildAddressString(address);
    setCustomer((c) => ({ ...c, address: addr }));
  }, [address]);

  const durationMs = useMemo(() => {
    if (!draft?.startAt || !draft?.endAt) return 0;
    const s = parseDateTimeLocal(draft.startAt);
    const e = parseDateTimeLocal(draft.endAt);
    if (!s || !e) return 0;
    const ms = e.getTime() - s.getTime();
    return ms > 0 ? ms : 0;
  }, [draft?.startAt, draft?.endAt]);

  const durationLabel = useMemo(() => {
    if (!durationMs) return "";
    const mins = Math.ceil(durationMs / (60 * 1000));
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    if (hours <= 0) return `${mins} min`;
    if (rem === 0) return `${hours}h`;
    return `${hours}h ${rem}m`;
  }, [durationMs]);

  const pricing = useMemo(() => {
    if (!durationMs) {
      return { options: [] as PriceOption[], best: null as PriceOption | null };
    }

    const H = 60 * 60 * 1000;
    const D = 24 * H;
    const W = 7 * D;
    const M = 30 * D;

    const hours = clampMin(Math.ceil(durationMs / H), 1);
    const days = clampMin(Math.ceil(durationMs / D), 1);
    const weeks = clampMin(Math.ceil(durationMs / W), 1);
    const months = clampMin(Math.ceil(durationMs / M), 1);

    const options: PriceOption[] = [
      {
        key: "hour",
        label: "Hourly",
        helper: "For shorter journeys and tighter cover windows",
        unitLabel: "hour",
        unitPrice: RATES.hour,
        units: hours,
        total: Number((hours * RATES.hour).toFixed(2)),
      },
      {
        key: "day",
        label: "Daily",
        helper: "A popular option for one-day or weekend cover",
        unitLabel: "day",
        unitPrice: RATES.day,
        units: days,
        total: Number((days * RATES.day).toFixed(2)),
      },
      {
        key: "week",
        label: "Weekly",
        helper: "Better value across several days of use",
        unitLabel: "week",
        unitPrice: RATES.week,
        units: weeks,
        total: Number((weeks * RATES.week).toFixed(2)),
      },
      {
        key: "month",
        label: "Monthly",
        helper: "Designed for longer temporary cover periods",
        unitLabel: "month",
        unitPrice: RATES.month,
        units: months,
        total: Number((months * RATES.month).toFixed(2)),
      },
    ];

    const best = options.reduce((acc, cur) => (cur.total < acc.total ? cur : acc), options[0]);
    return { options, best };
  }, [durationMs]);

  useEffect(() => {
    if (!pricing.best) return;
    setSelectedPlan((prev) => prev ?? pricing.best!.key);
  }, [pricing.best]);

  const selected = useMemo(() => {
    if (!selectedPlan) return null;
    return pricing.options.find((o) => o.key === selectedPlan) ?? null;
  }, [pricing.options, selectedPlan]);

  const validations = useMemo(() => {
    const fullNameOk = customer.fullName.trim().length >= 2;
    const emailOk = validEmail(customer.email);
    const age = calcAge(customer.dob);
    const dobOk = Boolean(customer.dob) && age !== null && age >= 17;
    const line1Ok = address.line1.trim().length >= 4;
    const townOk = address.town.trim().length >= 2;
    const postcodeOk = normalisePostcode(address.postcode).length >= 5;
    const addressOk = line1Ok && townOk && postcodeOk;
    const licenceOk = Boolean(customer.licenceType);
    const draftOk = Boolean(draft?.vrm && draft?.startAt && draft?.endAt && durationMs > 0);
    const pricingOk = Boolean(selected);

    return {
      fullNameOk,
      emailOk,
      dobOk,
      line1Ok,
      townOk,
      postcodeOk,
      addressOk,
      licenceOk,
      draftOk,
      pricingOk,
      canContinue:
        fullNameOk && emailOk && dobOk && addressOk && licenceOk && draftOk && pricingOk,
    };
  }, [customer, address, draft, durationMs, selected]);

  function saveDraft(next: QuoteDraft) {
    setDraft(next);
    try {
      sessionStorage.setItem("gtc_quote_draft", JSON.stringify(next));
    } catch {}
  }

  async function onContinueToPayment() {
    setFormError(null);

    if (!draft?.vrm) {
      setFormError(
        "We couldn’t find your saved vehicle details. Go back and re-enter your reg to continue."
      );
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (!draft.startAt || !draft.endAt || !durationMs) {
      setFormError("Your cover dates need adjusting — end time must be after start time.");
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (!selected) {
      setFormError("Choose a pricing option to continue.");
      pricingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (!validations.canContinue) {
      setFormError("Please complete your details before continuing to checkout.");
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const payload = {
      quoteRef: quoteRef || makeQuoteRef(),
      quote: {
        vrm: draft.vrm,
        make: draft.make,
        model: draft.model,
        year: draft.year,
        startAt: draft.startAt,
        endAt: draft.endAt,
        durationMs,
      },
      customer: { ...customer, address: buildAddressString(address) },
      pricing: {
        selectedPlan: selected.key,
        selectedLabel: selected.label,
        units: selected.units,
        unitPrice: selected.unitPrice,
        total: selected.total,
        rateCard: RATES,
      },
      createdAt: new Date().toISOString(),
    };

    try {
      sessionStorage.setItem("gtc_checkout_payload", JSON.stringify(payload));
    } catch {}

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          quote: {
            vrm: draft.vrm,
            make: draft.make || "",
            model: draft.model || "",
            year: draft.year || "",
            startAt: new Date(draft.startAt).toISOString(),
            endAt: new Date(draft.endAt).toISOString(),
            durationMs,
            totalAmountPence: Math.round((selected.total ?? 0) * 100),
          },
          customer: {
            fullName: customer.fullName,
            dob: customer.dob,
            email: customer.email,
            licenceType: customer.licenceType,
            address: buildAddressString(address),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Failed to start checkout");
      }

      window.location.href = data.url as string;
    } catch (err: any) {
      setFormError(err?.message || "Something went wrong starting checkout.");
      pricingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const vehicleTitle =
    [draft?.make, draft?.model].filter(Boolean).join(" ") || "Vehicle";

  const vehicleLine = draft?.vrm
    ? `${draft.vrm} • ${vehicleTitle}${draft?.year ? ` • ${draft.year}` : ""}`
    : "—";

  const datesLine =
    draft?.startAt && draft?.endAt
      ? `${prettyDateTime(draft.startAt)} → ${prettyDateTime(draft.endAt)}`
      : "—";

  const selectedPlanLine = selected
    ? `${selected.label} • ${selected.units} ${selected.unitLabel}${selected.units === 1 ? "" : "s"}`
    : "Choose a price option";

  return (
    <PageShell
      hideHero
      crumbs={[{ label: "Home", href: "/" }, { label: "Get quote" }]}
    >
      {/* HERO */}
      <section className="pt-2 sm:pt-4 lg:pt-6" ref={detailsRef}>
        <div className="max-w-[76rem]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.14)] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
            Get a quote
          </div>

          <div className="relative mt-6 max-w-[70rem]">
            <div className="pointer-events-none absolute inset-x-0 top-[8%] -z-10 opacity-55 sm:top-[12%]">
              <svg
                viewBox="0 0 1200 260"
                className="h-[220px] w-full sm:h-[260px] lg:h-[300px]"
                fill="none"
                aria-hidden="true"
                preserveAspectRatio="none"
              >
                <path
                  d="M18 152C114 62 222 227 338 152C446 82 548 216 676 142C794 72 906 201 1026 132C1090 96 1142 105 1182 122"
                  stroke="rgba(108,76,243,0.14)"
                  strokeWidth="34"
                  strokeLinecap="round"
                />
                <path
                  d="M10 154C108 66 216 224 334 150C444 80 544 214 672 140C792 70 904 198 1024 130C1088 95 1140 103 1190 120"
                  stroke="rgba(108,76,243,0.28)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h1 className="heading-unbalanced relative max-w-[13ch] text-[3.25rem] font-extrabold leading-[0.9] tracking-[-0.07em] text-slate-950 sm:max-w-[11.5ch] sm:text-[4.55rem] lg:max-w-[11ch] lg:text-[5.75rem]">
              Review your quote and continue
            </h1>
          </div>

          <p className="mt-10 max-w-[52rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.12rem]">
            Confirm your vehicle, cover period and details below, then continue to
            secure checkout. Documents are issued instantly after purchase and remain
            easy to retrieve later.
          </p>

          <div className="mt-8">
            <ProgressRail active={2} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
            <div className="rounded-[1.7rem] border border-slate-200/80 bg-white/88 p-5 shadow-sm sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryStat label="Vehicle" value={vehicleLine} strong />
                <SummaryStat label="Cover period" value={datesLine} />
                <SummaryStat label="Selected price" value={selectedPlanLine} />
                <SummaryStat
                  label="Total today"
                  value={selected ? moneyGBP(selected.total) : "Choose a price option"}
                  strong
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/" className="btn-ghost">
                  Change vehicle
                </Link>

                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setEditingDates((v) => !v);
                    setFormError(null);
                  }}
                >
                  {editingDates ? "Hide cover dates" : "Edit cover dates"}
                </button>
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-slate-200/80 bg-white/88 p-5 shadow-sm sm:p-6">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Quote reference
              </div>
              <div className="mt-2 break-words text-[1.08rem] font-semibold tracking-[-0.02em] text-slate-950">
                {quoteRef || "—"}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <MetaChip>{draft?.vrm ? "Saved on this device" : "Details missing"}</MetaChip>
                {durationLabel ? <MetaChip>Duration {durationLabel}</MetaChip> : null}
              </div>
            </div>
          </div>

          {editingDates && draft ? (
            <div className="mt-6 rounded-[1.7rem] border border-slate-200/80 bg-white/92 p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-base font-extrabold tracking-tight text-slate-950">
                    Adjust your cover dates
                  </div>
                  <p className="mt-1 text-sm leading-7 text-slate-600">
                    Update your start and end time here and pricing will refresh automatically.
                  </p>
                </div>

                <MetaChip>Updates instantly</MetaChip>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className="label">Start</label>
                  <div className="min-w-0 max-w-full overflow-hidden rounded-[0.95rem]">
                    <input
                      type="datetime-local"
                      className="input block !w-full min-w-0 max-w-full px-3 text-[16px] [appearance:none]"
                      value={draft.startAt}
                      onChange={(e) => saveDraft({ ...draft, startAt: e.target.value })}
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <label className="label">End</label>
                  <div className="min-w-0 max-w-full overflow-hidden rounded-[0.95rem]">
                    <input
                      type="datetime-local"
                      className="input block !w-full min-w-0 max-w-full px-3 text-[16px] [appearance:none]"
                      value={draft.endAt}
                      onChange={(e) => saveDraft({ ...draft, endAt: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {durationMs <= 0 ? (
                <div className="field-error mt-3">
                  End date and time must be after the start date and time.
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    const now = new Date();
                    now.setMinutes(Math.ceil(now.getMinutes() / 5) * 5, 0, 0);
                    saveDraft({ ...draft, startAt: toDatetimeLocalValue(now) });
                  }}
                >
                  Start now
                </button>

                <button type="button" className="btn-ghost" onClick={() => setEditingDates(false)}>
                  Done
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <AssuranceRow
              items={[
                "Secure checkout next",
                "Instant documents after payment",
                "Retrieve policy anytime",
              ]}
            />
          </div>

          <div className="mt-12 h-px w-full bg-[linear-gradient(90deg,rgba(226,232,240,0),rgba(226,232,240,0.95),rgba(226,232,240,0))]" />
        </div>
      </section>

      {/* YOUR DETAILS */}
      <section className="mt-16">
        <SectionIntro
          eyebrow="Your details"
          title="Add the details for your documents"
          copy="We’ll use these details for your quote, confirmation and policy documents."
          wide
        />

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.86fr)]">
          <div className="rounded-[1.9rem] border border-slate-200/80 bg-white/88 p-6 shadow-sm sm:p-8">
            <div className="grid gap-6">
              <div className="rounded-[1.45rem] border border-slate-200/80 bg-slate-50/55 p-5 sm:p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Driver details
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="fullName">
                      Full name
                    </label>
                    <input
                      id="fullName"
                      className="input"
                      placeholder="e.g. John Smith"
                      value={customer.fullName}
                      onChange={(e) => {
                        setCustomer((c) => ({ ...c, fullName: e.target.value }));
                        setFormError(null);
                      }}
                    />
                    {!validations.fullNameOk && customer.fullName ? (
                      <div className="field-error">
                        Enter your full name as it appears on your licence.
                      </div>
                    ) : (
                      <div className="field-help">
                        Make sure this matches your licence for documents.
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <label className="label" htmlFor="dob">
                      Date of birth
                    </label>
                    <div className="min-w-0 max-w-full overflow-hidden rounded-[0.95rem]">
                      <input
                        id="dob"
                        type="date"
                        className="input block !w-full min-w-0 max-w-full px-3 text-[16px] [appearance:none]"
                        value={customer.dob}
                        onChange={(e) => {
                          setCustomer((c) => ({ ...c, dob: e.target.value }));
                          setFormError(null);
                        }}
                      />
                    </div>

                    {customer.dob && !validations.dobOk ? (
                      <div className="field-error">You must be 17+ to continue.</div>
                    ) : (
                      <div className="field-help">We use this to confirm driver eligibility.</div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <label className="label" htmlFor="licenceType">
                      Driving licence type
                    </label>
                    <select
                      id="licenceType"
                      className="input"
                      value={customer.licenceType}
                      onChange={(e) => {
                        setCustomer((c) => ({
                          ...c,
                          licenceType: e.target.value as DrivingLicenceType,
                        }));
                        setFormError(null);
                      }}
                    >
                      <option value="UK">UK</option>
                      <option value="International">International</option>
                      <option value="Learner">Learner</option>
                    </select>
                    <div className="field-help">
                      This helps route you to the correct cover journey.
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      className="input"
                      placeholder="e.g. name@email.com"
                      inputMode="email"
                      value={customer.email}
                      onChange={(e) => {
                        setCustomer((c) => ({ ...c, email: e.target.value }));
                        setFormError(null);
                      }}
                    />
                    {customer.email && !validations.emailOk ? (
                      <div className="field-error">Enter a valid email address.</div>
                    ) : (
                      <div className="field-help">
                        We’ll send your documents and confirmation here.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-[1.45rem] border border-slate-200/80 bg-slate-50/55 p-5 sm:p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Address
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label">Address line 1</label>
                    <input
                      className="input"
                      placeholder="Address line 1 (house number + street)"
                      value={address.line1}
                      onChange={(e) => {
                        setAddress((a) => ({ ...a, line1: e.target.value }));
                        setFormError(null);
                      }}
                    />
                    {address.line1 && !validations.line1Ok ? (
                      <div className="field-error">Add your house number + street.</div>
                    ) : null}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label">Address line 2</label>
                    <input
                      className="input"
                      placeholder="Address line 2 (optional)"
                      value={address.line2}
                      onChange={(e) => {
                        setAddress((a) => ({ ...a, line2: e.target.value }));
                        setFormError(null);
                      }}
                    />
                  </div>

                  <div>
                    <label className="label">Town / City</label>
                    <input
                      className="input"
                      placeholder="Town / City"
                      value={address.town}
                      onChange={(e) => {
                        setAddress((a) => ({ ...a, town: e.target.value }));
                        setFormError(null);
                      }}
                    />
                    {address.town && !validations.townOk ? (
                      <div className="field-error">Enter your town/city.</div>
                    ) : null}
                  </div>

                  <div>
                    <label className="label">County</label>
                    <input
                      className="input"
                      placeholder="County (optional)"
                      value={address.county}
                      onChange={(e) => {
                        setAddress((a) => ({ ...a, county: e.target.value }));
                        setFormError(null);
                      }}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label">Postcode</label>
                    <input
                      className="input"
                      placeholder="Postcode"
                      value={address.postcode}
                      onChange={(e) => {
                        setAddress((a) => ({
                          ...a,
                          postcode: normalisePostcode(e.target.value),
                        }));
                        setFormError(null);
                      }}
                    />
                    {address.postcode && !validations.postcodeOk ? (
                      <div className="field-error">Enter a valid UK postcode.</div>
                    ) : (
                      <div className="field-help">We’ll format this automatically.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.9rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(245,242,255,0.70),rgba(255,255,255,0.96))] p-6 shadow-sm sm:p-8">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Checkout overview
            </div>

            <h3 className="mt-3 text-[1.8rem] font-extrabold leading-[0.96] tracking-[-0.04em] text-slate-950">
              A final review before payment
            </h3>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              Your selected price, cover period and document email are shown here.
              Once payment is complete, your documents are issued straight away.
            </p>

            <div className="mt-6 grid gap-3">
              <SummaryStat label="Selected plan" value={selectedPlanLine} />
              <SummaryStat
                label="Total today"
                value={selected ? moneyGBP(selected.total) : "Choose a price option"}
                strong
              />
              <SummaryStat label="Document email" value={customer.email || "—"} />
            </div>

            <div className="mt-6 rounded-[1.25rem] border border-slate-200/80 bg-white/84 px-5 py-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                After payment
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-700">
                {[
                  "Secure payment",
                  "Policy created",
                  "Documents emailed instantly",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 text-[12px] leading-6 text-slate-500">
              You can still review your details before payment.
            </div>
          </div>
        </div>
      </section>

      {/* CHOOSE YOUR PRICE */}
      <section className="mt-16" ref={pricingRef}>
        <SectionIntro
          eyebrow="Choose your price"
          title="Pick the option that fits your cover period"
          copy="Based on your selected dates. VAT included. You’ll review everything again before payment."
          wide
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {durationMs ? (
            pricing.options.map((opt) => (
              <PriceCard
                key={opt.key}
                option={opt}
                isSelected={selectedPlan === opt.key}
                isBest={pricing.best?.key === opt.key}
                onSelect={() => {
                  setSelectedPlan(opt.key);
                  setFormError(null);
                }}
              />
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-sm text-slate-600 lg:col-span-2">
              Add valid start and end dates to see pricing.
            </div>
          )}
        </div>

        <div className="mt-8 rounded-[1.9rem] border border-[rgba(108,76,243,0.10)] bg-[linear-gradient(180deg,rgba(245,242,255,0.72),rgba(255,255,255,0.94))] p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Total today
              </div>

              <div className="mt-2 text-sm leading-7 text-slate-700">
                {selected ? (
                  <>
                    {selected.units} {selected.unitLabel}
                    {selected.units === 1 ? "" : "s"} • {selected.label.toLowerCase()}
                  </>
                ) : (
                  "Choose a price option"
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  "Secure payment",
                  "Policy created after checkout",
                  "Documents emailed instantly",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.1rem] border border-slate-200/80 bg-white/84 px-4 py-4 text-sm font-semibold text-slate-950"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-left lg:text-right">
              <div className="text-4xl font-extrabold tracking-tight text-slate-950">
                {selected ? moneyGBP(selected.total) : "—"}
              </div>
              <div className="mt-1 text-[12px] text-slate-500">VAT included</div>
            </div>
          </div>

          {formError ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="font-extrabold">Action needed</div>
              <div className="mt-1">{formError}</div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onContinueToPayment}
              disabled={!validations.canContinue}
              className={`btn-primary ${!validations.canContinue ? "cursor-not-allowed opacity-60" : ""}`}
            >
              Continue to checkout
            </button>

            <Link href="/" className="btn-ghost">
              Start again
            </Link>
          </div>

          <div className="mt-4 text-[12px] leading-6 text-slate-500">
            Next step: secure payment, then instant documents by email.
          </div>
        </div>
      </section>

      {/* MOBILE CTA SPACER */}
      <div className="h-28 lg:hidden" />

      {/* MOBILE CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="container-app py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {selected ? selected.label : "Quote"}
              </div>
              <div className="truncate text-sm font-extrabold text-slate-900">
                {selected ? `${selected.label} • ${moneyGBP(selected.total)}` : "Choose a price option"}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                Secure checkout next
              </div>
            </div>

            <button
              type="button"
              onClick={onContinueToPayment}
              disabled={!validations.canContinue}
              className={`btn-primary ${!validations.canContinue ? "cursor-not-allowed opacity-60" : ""}`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}