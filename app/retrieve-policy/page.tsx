"use client";

import { useState } from "react";
import Link from "next/link";
import PageShell from "@/components/site/PageShell";

type LookupMethod = "reg-email" | "policy-number";

type PolicyResult = {
  policyNumber: string;
  vrm: string;
  make: string | null;
  model: string | null;
  year: string | null;
  startAt: string;
  endAt: string;
  status: string;
  email: string;
  certificateUrl: string | null;
  proposalUrl: string | null;
};

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */

function normaliseVrm(v: string) {
  return v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

function formatVrm(v: string) {
  const s = normaliseVrm(v);
  return s.length <= 4 ? s : `${s.slice(0, 4)} ${s.slice(4)}`;
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function fmt(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short", day: "2-digit", month: "short",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function vehicleLine(p: PolicyResult) {
  const mm = [p.make, p.model].filter(Boolean).join(" ");
  return `${formatVrm(p.vrm)}${mm ? ` · ${mm}` : ""}${p.year ? ` · ${p.year}` : ""}`;
}

/* ─────────────────────────────────────────────────────────
   Atoms
───────────────────────────────────────────────────────── */

function IconSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 60" strokeLinecap="round" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7.2 5.2 9.9 11.5 3.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PolicyField({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1.5 break-words text-[14px] font-semibold leading-snug text-slate-950">{value}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────── */

export default function RetrievePolicyPage() {
  const [method,  setMethod]  = useState<LookupMethod>("reg-email");
  const [vrm,     setVrm]     = useState("");
  const [email,   setEmail]   = useState("");
  const [polNum,  setPolNum]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [result,  setResult]  = useState<PolicyResult | null>(null);

  async function onLookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (method === "reg-email") {
      if (normaliseVrm(vrm).length < 5) { setError("Enter a valid registration number."); return; }
      if (!isEmail(email))               { setError("Enter the email address used at checkout."); return; }
    } else {
      if (!polNum.trim()) { setError("Enter your policy number."); return; }
    }

    setLoading(true);
    try {
      const body = method === "reg-email"
        ? { vrm: normaliseVrm(vrm), email: email.trim().toLowerCase() }
        : { policyNumber: polNum.trim().toUpperCase() };

      const res  = await fetch("/api/policy/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok || !data?.policy) {
        setError(data?.error || "We couldn't find a policy matching those details. Please check and try again.");
        return;
      }
      setResult(data.policy as PolicyResult);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell hideHero crumbs={[{ label: "Home", href: "/" }, { label: "Retrieve policy" }]}>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="pt-2 sm:pt-4 lg:pt-6">
        <div className="max-w-[76rem]">

          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.14)] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
            Policy retrieval
          </div>

          <div className="relative mt-6 max-w-[70rem]">
            <div className="pointer-events-none absolute inset-x-0 top-[8%] -z-10 opacity-55 sm:top-[12%]">
              <svg viewBox="0 0 1200 260" className="h-[220px] w-full sm:h-[260px] lg:h-[300px]" fill="none" aria-hidden="true" preserveAspectRatio="none">
                <path d="M18 152C114 62 222 227 338 152C446 82 548 216 676 142C794 72 906 201 1026 132C1090 96 1142 105 1182 122" stroke="rgba(108,76,243,0.14)" strokeWidth="34" strokeLinecap="round" />
                <path d="M10 154C108 66 216 224 334 150C444 80 544 214 672 140C792 70 904 198 1024 130C1088 95 1140 103 1190 120" stroke="rgba(108,76,243,0.28)" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="heading-unbalanced relative max-w-[10ch] text-[3.25rem] font-extrabold leading-[0.9] tracking-[-0.07em] text-slate-950 sm:text-[4.55rem] lg:text-[5.85rem]">
              Find your policy
            </h1>
          </div>

          <p className="mt-8 max-w-[44rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
            Enter your registration and the email you used at checkout — we'll pull up your policy and documents instantly.
          </p>

          <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-700">
            {["Instant retrieval", "Download anytime", "No login needed"].map(item => (
              <div key={item} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 h-px w-full bg-[linear-gradient(90deg,rgba(226,232,240,0),rgba(226,232,240,0.95),rgba(226,232,240,0))]" />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          LOOKUP FORM
      ══════════════════════════════════════════ */}
      <section className="mt-12">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">

          {/* ════════ FORM CARD ════════ */}
          <div>
            {result ? (

              /* ── Result ── */
              <div className="overflow-hidden rounded-[2.25rem] border border-slate-200/70 bg-white shadow-[0_24px_80px_rgba(108,76,243,0.07),0_2px_8px_rgba(15,23,42,0.04)]">
                <div className="h-[3px] w-full bg-[rgb(108,76,243)]" />

                {/* Found header */}
                <div className="flex items-center gap-3 border-b border-slate-100 px-7 py-5 sm:px-8">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgb(108,76,243)] text-white">
                    <IconCheck />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Policy found</p>
                    <p className="text-[15px] font-extrabold tracking-tight text-slate-950">{result.policyNumber}</p>
                  </div>
                  <span className={[
                    "ml-auto rounded-full px-3 py-1 text-[11px] font-bold",
                    result.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600",
                  ].join(" ")}>
                    {result.status}
                  </span>
                </div>

                {/* Policy details */}
                <div className="grid gap-x-10 gap-y-5 px-7 py-6 sm:grid-cols-2 sm:px-8">
                  <PolicyField label="Vehicle" value={vehicleLine(result)} wide />
                  <PolicyField label="Starts"  value={fmt(result.startAt)} />
                  <PolicyField label="Ends"    value={fmt(result.endAt)} />
                  <PolicyField label="Email"   value={result.email} wide />
                </div>

                {/* Dashed tear-off */}
                <div className="relative mx-7 sm:mx-8">
                  <div className="border-t border-dashed border-slate-200" />
                  <span className="absolute -left-10 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-200" aria-hidden="true" />
                  <span className="absolute -right-10 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-200" aria-hidden="true" />
                </div>

                {/* Document downloads */}
                <div className="px-7 py-6 sm:px-8">
                  <p className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-400">Your documents</p>
                  <div className="grid gap-2.5">
                    {result.certificateUrl ? (
                      <a
                        href={result.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[rgb(108,76,243)] px-7 text-[14.5px] font-semibold !text-white shadow-[0_8px_28px_rgba(108,76,243,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[rgb(96,66,225)]"
                      >
                        Download certificate of insurance
                        <IconArrow />
                      </a>
                    ) : (
                      <div className="flex min-h-[48px] w-full items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-7 text-[14px] text-slate-400">
                        Certificate not yet available
                      </div>
                    )}
                    {result.proposalUrl ? (
                      <a
                        href={result.proposalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 text-[14.5px] font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        View statement of fact
                        <IconArrow />
                      </a>
                    ) : (
                      <div className="flex min-h-[48px] w-full items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-7 text-[14px] text-slate-400">
                        Statement not yet available
                      </div>
                    )}
                  </div>
                </div>

                {/* Try again */}
                <div className="border-t border-slate-100 bg-slate-50/50 px-7 py-4 sm:px-8">
                  <button
                    type="button"
                    onClick={() => { setResult(null); setError(null); }}
                    className="text-[13px] font-semibold text-slate-500 underline-offset-4 hover:underline"
                  >
                    Search for a different policy
                  </button>
                </div>
              </div>

            ) : (

              /* ── Lookup form ── */
              <div className="overflow-hidden rounded-[2.25rem] border border-slate-200/70 bg-white shadow-[0_24px_80px_rgba(108,76,243,0.07),0_2px_8px_rgba(15,23,42,0.04)]">
                <div className="h-[3px] w-full bg-[rgb(108,76,243)]" />

                <div className="px-7 pb-8 pt-7 sm:px-10 sm:pt-8">

                  {/* Method toggle */}
                  <div className="mb-7 inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => { setMethod("reg-email"); setError(null); }}
                      className={[
                        "rounded-full px-4 py-2 text-[13px] font-semibold transition-all",
                        method === "reg-email"
                          ? "bg-[rgb(108,76,243)] !text-white shadow-[0_4px_14px_rgba(108,76,243,0.22)]"
                          : "text-slate-600 hover:text-slate-900",
                      ].join(" ")}
                    >
                      Reg &amp; email
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMethod("policy-number"); setError(null); }}
                      className={[
                        "rounded-full px-4 py-2 text-[13px] font-semibold transition-all",
                        method === "policy-number"
                          ? "bg-[rgb(108,76,243)] !text-white shadow-[0_4px_14px_rgba(108,76,243,0.22)]"
                          : "text-slate-600 hover:text-slate-900",
                      ].join(" ")}
                    >
                      Policy number
                    </button>
                  </div>

                  <form onSubmit={onLookup} noValidate>
                    <div className="grid gap-5">

                      {method === "reg-email" ? (
                        <>
                          <div>
                            <label htmlFor="vrm" className="mb-2 block text-[13px] font-semibold text-slate-800">
                              Vehicle registration
                            </label>
                            <input
                              id="vrm"
                              className="input w-full text-[1.1rem] font-bold uppercase tracking-[0.10em]"
                              placeholder="AB12 CDE"
                              value={formatVrm(vrm)}
                              autoCapitalize="characters"
                              autoCorrect="off"
                              spellCheck={false}
                              onChange={e => { setVrm(normaliseVrm(e.target.value)); setError(null); }}
                            />
                          </div>
                          <div>
                            <label htmlFor="email" className="mb-2 block text-[13px] font-semibold text-slate-800">
                              Email used at checkout
                            </label>
                            <input
                              id="email"
                              type="email"
                              inputMode="email"
                              className="input w-full"
                              placeholder="name@email.com"
                              value={email}
                              onChange={e => { setEmail(e.target.value); setError(null); }}
                            />
                            <p className="mt-2 text-[12px] text-slate-400">
                              Must match exactly what you entered when you bought cover.
                            </p>
                          </div>
                        </>
                      ) : (
                        <div>
                          <label htmlFor="polNum" className="mb-2 block text-[13px] font-semibold text-slate-800">
                            Policy number
                          </label>
                          <input
                            id="polNum"
                            className="input w-full uppercase tracking-[0.06em] text-[1rem] font-bold"
                            placeholder="CVZ-26-XXXXXXXX"
                            value={polNum}
                            onChange={e => { setPolNum(e.target.value); setError(null); }}
                          />
                          <p className="mt-2 text-[12px] text-slate-400">
                            Found on your confirmation email or success page.
                          </p>
                        </div>
                      )}

                    </div>

                    {error && (
                      <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                        <p className="text-[13px] font-semibold text-red-700">We couldn't find that policy</p>
                        <p className="mt-0.5 text-[13px] text-red-600">{error}</p>
                      </div>
                    )}

                    <div className="mt-6">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-[rgb(108,76,243)] px-8 text-[15px] font-semibold !text-white shadow-[0_12px_36px_rgba(108,76,243,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[rgb(96,66,225)] hover:shadow-[0_16px_44px_rgba(108,76,243,0.36)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
                      >
                        {loading ? <><IconSpinner /> Looking up…</> : <>Find my policy <IconArrow /></>}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* ════════ SIDEBAR ════════ */}
          <div className="grid gap-4">

            {/* Help card */}
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(108,76,243,0.05)]">
              <div className="divide-y divide-slate-100">
                <div className="px-5 py-4">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-400">Can't find it?</p>
                  <p className="mt-1 text-[14px] font-extrabold tracking-tight text-slate-950">Check these first</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {[
                    "Use the email you entered at checkout — not a different one",
                    "Registration must match exactly — no spaces needed",
                    "Check your junk folder for the original confirmation email",
                    "If you made a typo in your email, contact us",
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                      <span className="mt-0.5 text-[11px] font-bold tabular-nums text-[rgb(108,76,243)]/50">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[13px] text-slate-600">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="overflow-hidden rounded-[1.75rem] border border-[rgba(108,76,243,0.10)] bg-[rgba(108,76,243,0.04)] p-5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[rgb(108,76,243)]/60">Still stuck?</p>
              <p className="mt-1 text-[14px] font-extrabold tracking-tight text-slate-950">We can help</p>
              <p className="mt-1.5 text-[12.5px] leading-snug text-slate-500">
                Contact us with your name and the date you purchased cover and we'll locate your policy manually.
              </p>
              <Link
                href="/contact"
                className="mt-4 flex items-center justify-between rounded-[1rem] bg-[rgb(108,76,243)] px-4 py-3 text-[13.5px] font-semibold !text-white shadow-[0_6px_20px_rgba(108,76,243,0.22)] transition hover:-translate-y-0.5"
              >
                Contact support
                <IconArrow />
              </Link>
            </div>

            {/* Get cover again */}
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-400">Need cover again?</p>
              <p className="mt-1 text-[14px] font-extrabold tracking-tight text-slate-950">Get a new quote</p>
              <p className="mt-1.5 text-[12.5px] leading-snug text-slate-500">
                From 1 hour. Documents issued instantly after payment.
              </p>
              <Link
                href="/get-quote"
                className="mt-4 flex items-center justify-between rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-[13.5px] font-semibold text-slate-900 transition hover:border-[rgba(108,76,243,0.30)]"
              >
                Start a quote
                <IconArrow />
              </Link>
            </div>

          </div>
        </div>
      </section>

    </PageShell>
  );
}