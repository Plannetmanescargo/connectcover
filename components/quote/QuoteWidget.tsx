"use client";

import React from "react";
import { Fragment, useEffect, useMemo, useState } from "react";

type DurationUnit = "hours" | "days" | "weeks" | "months";
type Step = 1 | 2 | 3;

const QUICK_DURATION_OPTIONS: Array<{
  label: string;
  value: number;
  unit: DurationUnit;
}> = [
  { label: "1 hour", value: 1, unit: "hours" },
  { label: "1 day", value: 1, unit: "days" },
  { label: "7 days", value: 7, unit: "days" },
  { label: "1 month", value: 1, unit: "months" },
];

const UNIT_CONFIG: Record<
  DurationUnit,
  { label: string; min: number; max: number; step: number }
> = {
  hours: { label: "Hours", min: 1, max: 24, step: 1 },
  days: { label: "Days", min: 1, max: 31, step: 1 },
  weeks: { label: "Weeks", min: 1, max: 12, step: 1 },
  months: { label: "Months", min: 1, max: 12, step: 1 },
};

export default function QuoteWidget({
  compact,
  showDatesInCompact = true,
}: {
  compact?: boolean;
  showDatesInCompact?: boolean;
}) {
  const [step, setStep] = useState<Step>(1);

  const [vrm, setVrm] = useState("");
  const [loading, setLoading] = useState(false);

  const [vehicle, setVehicle] = useState<any>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [manualMode, setManualMode] = useState(false);
  const [manualMake, setManualMake] = useState("");
  const [manualModel, setManualModel] = useState("");
  const [manualYear, setManualYear] = useState("");

  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const [durationValue, setDurationValue] = useState<string>("");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("days");

  const requireDates = !compact || showDatesInCompact;

  const normaliseVrm = (value: string) =>
    value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);

  const formatVrm = (normalized: string) => {
    const s = normaliseVrm(normalized);
    if (s.length <= 4) return s;
    return `${s.slice(0, 4)} ${s.slice(4)}`;
  };

  const vrmDisplay = useMemo(() => formatVrm(vrm), [vrm]);

  const lookupMake = vehicle?.make || "";
  const lookupModel = vehicle?.model || "";
  const lookupYear = vehicle?.year ? String(vehicle.year) : "";
  const lookupColour = vehicle?.colour || "";
  const lookupFuel = vehicle?.fuelType || "";

  const hasLookupBasics = Boolean(lookupMake || lookupModel);

  const chosenMake = manualMode ? manualMake.trim() : lookupMake || manualMake.trim();
  const chosenModel = manualMode ? manualModel.trim() : lookupModel || manualModel.trim();
  const chosenYear = manualMode ? manualYear.trim() : lookupYear || manualYear.trim();

  const manualBasicsComplete = Boolean(manualMake.trim() && manualModel.trim());
  const hasChosenVehicleBasics = manualMode
    ? manualBasicsComplete
    : hasLookupBasics || manualBasicsComplete;

  const vehicleReady = vrm.length >= 5 && hasChosenVehicleBasics;

  const durationNumber = Number(durationValue);
  const hasValidDurationValue = Number.isFinite(durationNumber) && durationNumber > 0;

  function toDatetimeLocalValue(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  }

  function addDurationToStart(startIso: string, amountMs: number) {
    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) return "";
    const end = new Date(start.getTime() + amountMs);
    return toDatetimeLocalValue(end);
  }

  function daysInMonth(year: number, monthIndex0: number) {
    return new Date(year, monthIndex0 + 1, 0).getDate();
  }

  function addMonthsToStart(startIso: string, monthsToAdd: number) {
    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) return "";

    const startYear = start.getFullYear();
    const startMonth = start.getMonth();
    const startDate = start.getDate();
    const hours = start.getHours();
    const minutes = start.getMinutes();

    const absoluteMonth = startMonth + monthsToAdd;
    const targetYear = startYear + Math.floor(absoluteMonth / 12);
    const targetMonth = ((absoluteMonth % 12) + 12) % 12;

    const maxDay = daysInMonth(targetYear, targetMonth);
    const safeDay = Math.min(startDate, maxDay);

    const end = new Date(targetYear, targetMonth, safeDay, hours, minutes, 0, 0);

    return toDatetimeLocalValue(end);
  }

  function clampDurationValue(value: number, unit: DurationUnit) {
    const cfg = UNIT_CONFIG[unit];
    return Math.min(cfg.max, Math.max(cfg.min, value));
  }

  function calculateEndAt(startIso: string, valueStr: string, unit: DurationUnit) {
    if (!startIso) return "";

    const n = Number(valueStr);
    if (!Number.isFinite(n) || n <= 0) return "";

    const safeValue = clampDurationValue(n, unit);

    if (unit === "months") {
      return addMonthsToStart(startIso, safeValue);
    }

    const H = 60 * 60 * 1000;
    const D = 24 * H;
    const ms =
      unit === "hours"
        ? safeValue * H
        : unit === "days"
        ? safeValue * D
        : safeValue * 7 * D;

    return addDurationToStart(startIso, ms);
  }

  useEffect(() => {
    if (!requireDates) return;
    if (!startAt) {
      setEndAt("");
      return;
    }

    const computed = calculateEndAt(startAt, durationValue, durationUnit);
    setEndAt(computed);
  }, [startAt, durationValue, durationUnit, requireDates]);

  const datesValid = useMemo(() => {
    if (!requireDates) return true;
    if (!startAt || !endAt) return false;
    const s = new Date(startAt).getTime();
    const e = new Date(endAt).getTime();
    return Number.isFinite(s) && Number.isFinite(e) && e > s;
  }, [startAt, endAt, requireDates]);

  const canLookupNow = useMemo(() => vrm.length >= 5 && !loading, [vrm, loading]);

  const canContinue = useMemo(() => {
    const hasDates = !requireDates ? true : Boolean(startAt && endAt);
    return Boolean(vrm.length >= 5 && hasChosenVehicleBasics && hasDates && datesValid);
  }, [vrm, requireDates, startAt, endAt, datesValid, hasChosenVehicleBasics]);

  const vehicleTitle = useMemo(() => {
    const mm = [lookupMake || manualMake, lookupModel || manualModel]
      .filter(Boolean)
      .join(" ");
    return mm || "Vehicle details";
  }, [lookupMake, lookupModel, manualMake, manualModel]);

  const activeQuickPick = useMemo(() => {
    return QUICK_DURATION_OPTIONS.find(
      (option) =>
        option.unit === durationUnit &&
        Number(durationValue || 0) === option.value
    );
  }, [durationUnit, durationValue]);

  const step1Ready = vehicleReady;
  const step2Ready = Boolean(startAt);
  const step3Ready = Boolean(durationValue && startAt && endAt && datesValid);

  async function lookupVehicle(vrmOverride?: string) {
    const vrmToUse = normaliseVrm(vrmOverride ?? vrm);
    if (vrmToUse.length < 5 || loading) return;

    setLoading(true);
    setLookupError(null);
    setFormError(null);

    try {
      const res = await fetch("/api/vehicle/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vrm: vrmToUse }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Vehicle lookup failed. Please try again.");
      }

      const summary = data?.summary ?? null;
      setVehicle(summary);

      const make = summary?.make ?? "";
      const model = summary?.model ?? "";
      const year = summary?.year ? String(summary.year) : "";

      if (make && !manualMake) setManualMake(make);
      if (model && !manualModel) setManualModel(model);
      if (year && !manualYear) setManualYear(year);

      if (!make || !model) setManualMode(true);
    } catch (e: any) {
      setLookupError(e?.message || "Vehicle lookup failed. Please try again.");
      setManualMode(true);
    } finally {
      setLoading(false);
    }
  }

  function buildQuoteDraft() {
    return {
      vrm,
      make: chosenMake || "",
      model: chosenModel || "",
      year: chosenYear || "",
      startAt: startAt || "",
      endAt: endAt || "",
      savedAt: new Date().toISOString(),
    };
  }

  function goToQuote() {
    setFormError(null);

    if (!canContinue) {
      setFormError(
        "Please enter your registration, confirm the vehicle, and choose valid cover dates and times."
      );
      return;
    }

    const draft = buildQuoteDraft();
    try {
      sessionStorage.setItem("gtc_quote_draft", JSON.stringify(draft));
    } catch {}

    window.location.assign("/get-quote");
  }

  function goNext() {
    setFormError(null);

    if (step === 1) {
      if (!step1Ready) {
        setFormError("Please enter your registration and confirm the vehicle details.");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!step2Ready) {
        setFormError("Please choose when your cover should start.");
        return;
      }
      setStep(3);
    }
  }

  function goBack() {
    setFormError(null);
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));
  }

  function toggleManualMode() {
    setManualMode((v) => !v);
    setFormError(null);
  }

  function setStartNow() {
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 5) * 5, 0, 0);
    const value = toDatetimeLocalValue(now);

    setStartAt(value);
    setFormError(null);
  }

  function applyQuickDuration(value: number, unit: DurationUnit) {
    setDurationValue(String(value));
    setDurationUnit(unit);
    setFormError(null);
  }

  function changeDurationUnit(nextUnit: DurationUnit) {
    setDurationUnit(nextUnit);
    setFormError(null);

    if (!durationValue) return;

    const n = Number(durationValue);
    if (!Number.isFinite(n) || n <= 0) return;

    const clamped = clampDurationValue(n, nextUnit);
    if (clamped !== n) {
      setDurationValue(String(clamped));
    }
  }

  function incrementDuration() {
    const cfg = UNIT_CONFIG[durationUnit];
    const current = hasValidDurationValue ? durationNumber : cfg.min;
    const next = Math.min(cfg.max, current + cfg.step);
    setDurationValue(String(next));
    setFormError(null);
  }

  function decrementDuration() {
    const cfg = UNIT_CONFIG[durationUnit];
    const current = hasValidDurationValue ? durationNumber : cfg.min;
    const next = Math.max(cfg.min, current - cfg.step);
    setDurationValue(String(next));
    setFormError(null);
  }

  function renderSummaryDateTime(value: string) {
    if (!value) {
      return <div className="text-sm font-semibold text-slate-950">—</div>;
    }

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      return <div className="break-words text-sm font-semibold text-slate-950">{value}</div>;
    }

    return (
      <div className="text-sm font-semibold leading-tight text-slate-950">
        <div className="break-words">
          {d.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </div>
        <div className="mt-1 break-words">
          {d.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-full overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 max-w-full">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
            {compact ? "Quick quote" : "Get your quote"}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            {compact
              ? "Enter your registration and choose the cover you need."
              : "Check your vehicle, choose when cover should start, and see your quote in minutes."}
          </p>
        </div>
      </div>

      <div className="mt-4 max-w-full rounded-[1rem] border border-slate-200 bg-slate-50/70 px-4 py-3">
        <div className="flex justify-center">
          <div className="flex max-w-full items-center gap-2 text-sm font-semibold">
            {[1, 2, 3].map((n, index) => (
              <Fragment key={n}>
                <span
                  className={[
                    "inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full px-2 transition",
                    step === n
                      ? "bg-[rgb(108,76,243)] text-white shadow-sm"
                      : n < step
                      ? "bg-[rgba(108,76,243,0.10)] text-[rgb(108,76,243)]"
                      : "border border-slate-200 bg-white text-slate-400",
                  ].join(" ")}
                >
                  {n}
                </span>

                {index < 2 ? (
                  <span className="h-px w-4 shrink-0 bg-slate-300 sm:w-5" aria-hidden="true" />
                ) : null}
              </Fragment>
            ))}
          </div>
        </div>

        <div className="mt-3 text-center text-sm font-medium text-slate-700">
          {step === 1 && "Your vehicle"}
          {step === 2 && "Start time"}
          {step === 3 && "Duration & cover"}
        </div>
      </div>

      <div className="mt-5 grid max-w-full gap-4 pb-[calc(env(safe-area-inset-bottom)+120px)] sm:pb-0">
        <div className="card-elevated min-w-0 max-w-full overflow-hidden p-4 sm:p-6">
          <div className="grid min-w-0 gap-5">
            {step === 1 ? (
              <section className="stack-sm min-w-0 max-w-full">
                <div>
                  <h4 className="text-sm font-semibold text-slate-950">Your vehicle</h4>
                  <p className="text-sm text-slate-600">
                    Enter your registration and we’ll check the vehicle details.
                  </p>
                </div>

                <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_140px]">
                  <input
                    id="vrm"
                    className="input min-w-0 w-full vrm-display"
                    placeholder="e.g. AB12 CDE"
                    value={vrmDisplay}
                    onChange={(e) => {
                      const next = normaliseVrm(e.target.value);
                      setVrm(next);
                      setFormError(null);
                      setLookupError(null);
                      setVehicle(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (canLookupNow) lookupVehicle(vrm);
                      }
                    }}
                    autoCapitalize="characters"
                    autoCorrect="off"
                    inputMode="text"
                    spellCheck={false}
                    aria-invalid={!!lookupError}
                    aria-describedby={lookupError ? "vrm-error" : "vrm-hint"}
                  />

                  <button
                    type="button"
                    onClick={() => lookupVehicle(vrm)}
                    disabled={!canLookupNow}
                    className={`btn-ghost min-w-0 ${!canLookupNow ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    {loading ? "Checking..." : "Check registration"}
                  </button>
                </div>

                <div
                  id="vrm-hint"
                  className="flex flex-col gap-2 text-[12px] text-slate-500 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>Press Enter or tap Check registration.</span>

                  <button type="button" onClick={toggleManualMode} className="link text-left text-[12px] font-medium">
                    {manualMode ? "Hide manual entry" : "Enter details manually"}
                  </button>
                </div>

                {lookupError ? (
                  <div
                    id="vrm-error"
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    <div className="font-semibold">We couldn’t confirm the vehicle automatically</div>
                    <div className="mt-1">{lookupError}</div>
                    <div className="mt-2 text-[12px] text-red-700/80">
                      You can still continue by entering the vehicle details manually below.
                    </div>
                  </div>
                ) : null}

                {vehicle ? (
                  <div className="card-soft px-4 py-4">
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Vehicle found
                        </div>
                        <div className="mt-1 break-words text-sm font-semibold text-slate-950">
                          {vehicleTitle}
                        </div>
                        <div className="mt-1 break-words text-[13px] text-slate-600">
                          {lookupColour ? lookupColour : null}
                          {lookupFuel ? ` • ${lookupFuel}` : null}
                          {lookupYear ? ` • ${lookupYear}` : null}
                        </div>
                      </div>

                      <span className="badge self-start">{hasLookupBasics ? "Verified" : "Check"}</span>
                    </div>
                  </div>
                ) : null}

                {manualMode ? (
                  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-semibold text-slate-950">
                        Enter vehicle details manually
                      </div>
                      <p className="text-sm text-slate-600">
                        Make and model are enough to continue. Year is optional.
                      </p>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="min-w-0">
                        <label className="label" htmlFor="make">
                          Make
                        </label>
                        <input
                          id="make"
                          className="input min-w-0 w-full"
                          placeholder="e.g. Toyota"
                          value={manualMake}
                          onChange={(e) => {
                            setManualMake(e.target.value);
                            setFormError(null);
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <label className="label" htmlFor="model">
                          Model
                        </label>
                        <input
                          id="model"
                          className="input min-w-0 w-full"
                          placeholder="e.g. Yaris"
                          value={manualModel}
                          onChange={(e) => {
                            setManualModel(e.target.value);
                            setFormError(null);
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <label className="label" htmlFor="year">
                          Year (optional)
                        </label>
                        <input
                          id="year"
                          className="input min-w-0 w-full"
                          placeholder="e.g. 2018"
                          inputMode="numeric"
                          value={manualYear}
                          onChange={(e) => {
                            setManualYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4));
                            setFormError(null);
                          }}
                        />
                      </div>
                    </div>

                    {!manualBasicsComplete ? (
                      <div className="field-help mt-3">Make and model are enough to continue.</div>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            {step === 2 && requireDates ? (
              <section className="stack-sm min-w-0 max-w-full">
                <div>
                  <h4 className="text-sm font-semibold text-slate-950">When should cover start?</h4>
                  <p className="text-sm text-slate-600">
                    Choose the date and time your cover should begin.
                  </p>
                </div>

                <div className="grid min-w-0 max-w-full grid-cols-1 gap-3 overflow-hidden">
                  <div className="min-w-0 max-w-full overflow-hidden rounded-[0.95rem]">
                    <input
                      type="datetime-local"
                      className="input block !w-full min-w-0 max-w-full px-3 text-[16px] [appearance:none]"
                      value={startAt}
                      onChange={(e) => {
                        setStartAt(e.target.value);
                        setFormError(null);
                      }}
                      disabled={!vehicleReady}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={setStartNow}
                    disabled={!vehicleReady}
                    className={`btn-ghost w-full min-w-0 sm:w-auto ${!vehicleReady ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    Start now
                  </button>
                </div>

                {!vehicleReady ? (
                  <div className="field-help">
                    Confirm the vehicle first to choose a start time.
                  </div>
                ) : null}

                {startAt ? (
                  <div className="card-soft px-4 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Start time
                    </div>
                    <div className="mt-1 break-words text-sm font-semibold text-slate-950">
                      {new Date(startAt).toLocaleString(undefined, {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {step === 3 && requireDates ? (
              <section className="stack-sm min-w-0 max-w-full">
                <div>
                  <h4 className="text-sm font-semibold text-slate-950">How long do you need cover?</h4>
                  <p className="text-sm text-slate-600">
                    Choose a common option or set your own duration.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {QUICK_DURATION_OPTIONS.map((option) => {
                    const active =
                      activeQuickPick?.value === option.value &&
                      activeQuickPick?.unit === option.unit;

                    const disabled = !vehicleReady;

                    return (
                      <button
                        key={`${option.value}-${option.unit}`}
                        type="button"
                        disabled={disabled}
                        onClick={() => applyQuickDuration(option.value, option.unit)}
                        className={[
                          "min-w-0 rounded-full border px-3 py-2 text-center text-[13px] font-semibold transition",
                          disabled
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                            : active
                            ? "border-[rgb(108,76,243)] bg-[rgba(108,76,243,0.08)] text-slate-950"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                <div className="min-w-0 max-w-full overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                  <div className="grid min-w-0 max-w-full gap-4">
                    <div className="min-w-0">
                      <label className="label">Duration</label>
                      <div className="flex w-full min-w-0 items-center overflow-hidden rounded-[1rem] border border-slate-200 bg-white p-1">
                        <button
                          type="button"
                          onClick={decrementDuration}
                          disabled={!vehicleReady}
                          className={`inline-flex h-11 w-10 shrink-0 items-center justify-center rounded-[0.8rem] text-lg font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-11 ${
                            !vehicleReady ? "cursor-not-allowed opacity-50" : ""
                          }`}
                          aria-label="Decrease duration"
                        >
                          −
                        </button>

                        <input
                          className="w-0 min-w-0 flex-1 bg-transparent px-1 text-center text-base font-semibold text-slate-950 outline-none sm:px-2"
                          inputMode="numeric"
                          placeholder={String(UNIT_CONFIG[durationUnit].min)}
                          value={durationValue}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
                            setDurationValue(raw);
                            setFormError(null);
                          }}
                          disabled={!vehicleReady}
                          aria-label="Duration value"
                        />

                        <button
                          type="button"
                          onClick={incrementDuration}
                          disabled={!vehicleReady}
                          className={`inline-flex h-11 w-10 shrink-0 items-center justify-center rounded-[0.8rem] text-lg font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-11 ${
                            !vehicleReady ? "cursor-not-allowed opacity-50" : ""
                          }`}
                          aria-label="Increase duration"
                        >
                          +
                        </button>
                      </div>

                      <div className="mt-2 text-[12px] text-slate-500">
                        {durationUnit === "hours" && "Choose between 1 and 24 hours."}
                        {durationUnit === "days" && "Choose between 1 and 31 days."}
                        {durationUnit === "weeks" && "Choose between 1 and 12 weeks."}
                        {durationUnit === "months" && "Choose between 1 and 12 months."}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <label className="label">Unit</label>

                      <div className="grid w-full grid-cols-2 gap-1 rounded-[1rem] border border-slate-200 bg-white p-1">
                        {(Object.keys(UNIT_CONFIG) as DurationUnit[]).map((unit) => {
                          const active = durationUnit === unit;

                          return (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => changeDurationUnit(unit)}
                              disabled={!vehicleReady}
                              className={[
                                "min-w-0 rounded-[0.8rem] px-2 py-2.5 text-center text-sm font-semibold transition",
                                !vehicleReady
                                  ? "cursor-not-allowed text-slate-400"
                                  : active
                                  ? "bg-[rgba(108,76,243,0.10)] text-slate-950"
                                  : "text-slate-600 hover:bg-slate-50",
                              ].join(" ")}
                            >
                              {UNIT_CONFIG[unit].label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="min-w-0 rounded-[1rem] border border-slate-200 bg-white px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        End time
                      </div>

                      {startAt && endAt && datesValid ? (
                        <div className="mt-1 text-sm font-semibold leading-tight text-slate-950">
                          <div className="break-words">
                            {new Date(endAt).toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="mt-1 break-words">
                            {new Date(endAt).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 text-sm text-slate-500">
                          {startAt ? "Choose a duration." : "Choose a start time first."}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!datesValid && startAt && endAt ? (
                  <div className="field-error">
                    End date and time must be after the start.
                  </div>
                ) : null}

                <div className="divider-soft" />

                <section className="stack-sm min-w-0 max-w-full">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-950">Your cover</h4>
                    <p className="text-sm text-slate-600">
                      Review the details below before continuing.
                    </p>
                  </div>

                  <div className="card-soft min-w-0 max-w-full p-4 sm:p-5">
                    <div className="grid gap-5 lg:grid-cols-3">
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Vehicle
                        </div>
                        <div className="mt-1 break-words text-sm font-semibold text-slate-950">
                          {vehicleTitle}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Registration
                        </div>
                        <div className="mt-1 break-words text-sm font-semibold text-slate-950 vrm-display">
                          {vrmDisplay || "—"}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Policy period
                        </div>

                        <div className="mt-2 space-y-2.5">
                          <div className="grid gap-1">
                            <span className="text-[12px] font-medium text-slate-500">Starts</span>
                            <div>{renderSummaryDateTime(startAt)}</div>
                          </div>

                          <div className="grid gap-1">
                            <span className="text-[12px] font-medium text-slate-500">Ends</span>
                            <div>{renderSummaryDateTime(endAt)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </section>
            ) : null}

            {formError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="font-semibold">A few details are still needed</div>
                <div className="mt-1">{formError}</div>
              </div>
            ) : null}

            <div className="hidden items-center justify-between gap-3 sm:flex">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1}
                className={`btn-ghost ${step === 1 ? "cursor-not-allowed opacity-50" : ""}`}
              >
                Back
              </button>

              {step < 3 ? (
                <button type="button" onClick={goNext} className="btn-primary">
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToQuote}
                  className={`btn-primary ${!canContinue ? "cursor-not-allowed opacity-60" : ""}`}
                  disabled={!canContinue}
                >
                  See your quote
                </button>
              )}
            </div>
          </div>
        </div>

        {!compact ? (
          <div className="grid gap-2 text-[12px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              Secure checkout next
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              Instant documents after purchase
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              Policy retrieval anytime
            </div>
          </div>
        ) : null}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/92 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        <div className="mx-auto max-w-xl px-4 py-3">
          {step < 3 ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1}
                className={`btn-ghost flex-1 ${step === 1 ? "cursor-not-allowed opacity-50" : ""}`}
              >
                Back
              </button>
              <button type="button" onClick={goNext} className="btn-primary flex-1">
                Continue
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={goToQuote}
              className={`btn-primary btn-primary-block ${
                !canContinue ? "cursor-not-allowed opacity-60" : ""
              }`}
              disabled={!canContinue}
            >
              See your quote
            </button>
          )}

          {step < 3 ? (
            <div className="mt-2 text-[11px] text-slate-500">
{step === 1 && "Confirm your vehicle details, then tap Continue above."}
{step === 2 && "Choose a start time, then tap Continue above."}
            </div>
          ) : !canContinue ? (
            <div className="mt-2 text-[11px] text-slate-500">
              Choose your duration, then review your cover above.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}