"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/site/PageShell";

type FormState = {
  name: string;
  email: string;
  topic: "General" | "Documents" | "Policy retrieval" | "Quote issue" | "Eligibility" | "Other";
  policyRef: string;
  message: string;
  website: string;
};

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

const TOPICS: FormState["topic"][] = [
  "General", "Documents", "Policy retrieval", "Quote issue", "Eligibility", "Other",
];

/* ─────────────────────────────────────────────────────────
   Conversation step wrapper
   Each question takes a focused row — like a chat, not a form
───────────────────────────────────────────────────────── */
function ConvoStep({
  n, label, hint, done, children,
}: {
  n: number; label: string; hint?: string; done?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-4 gap-y-1.5">
      {/* Step number / done tick */}
      <div className="flex flex-col items-center pt-0.5">
        <span className={[
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300",
          done
            ? "bg-[rgb(108,76,243)] text-white"
            : "border-2 border-[rgb(108,76,243)] bg-white text-[rgb(108,76,243)]",
        ].join(" ")}>
          {done ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : n}
        </span>
        {/* Connector line */}
        <div className="mt-1.5 w-px flex-1 bg-slate-100" />
      </div>

      {/* Content */}
      <div className="pb-8">
        <label className="block text-[14.5px] font-extrabold tracking-[-0.02em] text-slate-950">
          {label}
        </label>
        {hint && <p className="mt-0.5 text-[12.5px] text-slate-400">{hint}</p>}
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-red-600">
      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
        <path d="M7 1a6 6 0 1 0 0 12A6 6 0 0 0 7 1Zm0 3.5a.65.65 0 0 1 .65.65v2.2a.65.65 0 0 1-1.3 0V5.15A.65.65 0 0 1 7 4.5Zm0 5.25a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75Z" />
      </svg>
      {children}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────── */

export default function ContactPage() {
  const SUPPORT_EMAIL = "support@coverza.com";

  const [form, setForm] = useState<FormState>({
    name: "", email: "", topic: "General", policyRef: "", message: "", website: "",
  });
  const [status,   setStatus]   = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [touched,  setTouched]  = useState<Partial<Record<keyof FormState, true>>>({});

  function touch(f: keyof FormState) { setTouched(p => ({ ...p, [f]: true })); }

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.name.trim())               e.name    = "Please enter your name.";
    if (!isEmail(form.email))            e.email   = "Please enter a valid email address.";
    if (form.message.trim().length < 12) e.message = "Please add a little more detail.";
    return e;
  }, [form]);

  const canSend = status !== "sending" && Object.keys(errors).length === 0;

  /* Steps "done" state — used for the step connectors */
  const nameDone    = form.name.trim().length >= 2;
  const emailDone   = isEmail(form.email);
  const topicDone   = true; // always has a value
  const messageDone = form.message.trim().length >= 12;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setTouched({ name: true, email: true, message: true });
    if (form.website.trim()) { setStatus("sent"); return; }
    if (!canSend) { setErrorMsg("Please check the fields above before sending."); return; }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (res.ok) { setStatus("sent"); return; }
      throw new Error("API error");
    } catch {
      const subject = encodeURIComponent(`[Coverza] ${form.topic} — ${form.name}`);
      const lines = [`Name: ${form.name}`, `Email: ${form.email}`, `Topic: ${form.topic}`, form.policyRef.trim() ? `Policy reference: ${form.policyRef.trim()}` : "", "", form.message.trim()].filter(Boolean);
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${encodeURIComponent(lines.join("\n"))}`;
      setStatus("sent");
    }
  }

  return (
    <PageShell hideHero crumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}>

      {/* ══════════════════════════════════════════
          HERO — full-width, consistent with site
      ══════════════════════════════════════════ */}
      <section className="pt-2 sm:pt-4 lg:pt-6">
        <div className="max-w-[76rem]">

          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.14)] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
            Contact support
          </div>

          <div className="relative mt-6 max-w-[70rem]">
            <div className="pointer-events-none absolute inset-x-0 top-[8%] -z-10 opacity-55 sm:top-[12%]">
              <svg viewBox="0 0 1200 260" className="h-[220px] w-full sm:h-[260px] lg:h-[300px]" fill="none" aria-hidden="true" preserveAspectRatio="none">
                <path d="M18 152C114 62 222 227 338 152C446 82 548 216 676 142C794 72 906 201 1026 132C1090 96 1142 105 1182 122" stroke="rgba(108,76,243,0.14)" strokeWidth="34" strokeLinecap="round" />
                <path d="M10 154C108 66 216 224 334 150C444 80 544 214 672 140C792 70 904 198 1024 130C1088 95 1140 103 1190 120" stroke="rgba(108,76,243,0.28)" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="heading-unbalanced relative max-w-[10ch] text-[3.25rem] font-extrabold leading-[0.9] tracking-[-0.07em] text-slate-950 sm:text-[4.55rem] lg:text-[5.85rem]">
              We're here to help
            </h1>
          </div>

          <p className="mt-8 max-w-[46rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
            Walk through the form below — takes less than a minute. If you already have cover, have your policy reference ready.
          </p>

          <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-700">
            {["Same-day responses", "Clear next steps", "No hold music"].map(item => (
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
          TWO-COLUMN LAYOUT
      ══════════════════════════════════════════ */}
      <section className="mt-12">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_310px] xl:items-start">

          {/* ════════════ FORM ════════════ */}
          <div>
            {status === "sent" ? (

              /* ── Sent confirmation ── */
              <div className="relative overflow-hidden rounded-[2.25rem] border border-slate-200/70 bg-white shadow-[0_24px_80px_rgba(108,76,243,0.07),0_2px_8px_rgba(15,23,42,0.04)]">
                <div className="h-[3px] w-full bg-[rgb(108,76,243)]" />
                <div className="px-8 py-12 text-center sm:px-12">
                  <div className="flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(108,76,243)] shadow-[0_12px_40px_rgba(108,76,243,0.28)]">
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                        <path d="M6 14.5 11.2 19.8 22 9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <h2 className="mt-5 text-[1.7rem] font-extrabold tracking-[-0.04em] text-slate-950">Message sent.</h2>
                  <p className="mt-3 text-[0.95rem] leading-[1.85] text-slate-500">
                    We'll reply to{" "}
                    <span className="font-semibold text-slate-900">{form.email}</span>{" "}
                    within one business day. Check your junk folder if you don't hear back.
                  </p>
                  <p className="mt-2 text-[12.5px] text-slate-400">
                    Or reach us directly at{" "}
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-[rgb(108,76,243)] underline-offset-4 hover:underline">
                      {SUPPORT_EMAIL}
                    </a>
                  </p>
                  <button
                    type="button"
                    onClick={() => { setStatus("idle"); setTouched({}); setForm(f => ({ ...f, message: "", policyRef: "" })); }}
                    className="mt-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-2.5 text-[13.5px] font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Send another message
                  </button>
                </div>
              </div>

            ) : (

              /* ── Conversation form ── */
              <form onSubmit={onSubmit} noValidate>

                {/* Outer card with connected step lines */}
                <div className="relative overflow-hidden rounded-[2.25rem] border border-slate-200/70 bg-white shadow-[0_24px_80px_rgba(108,76,243,0.07),0_2px_8px_rgba(15,23,42,0.04)]">
                  <div className="h-[3px] w-full bg-[rgb(108,76,243)]" />

                  <div className="px-7 pb-2 pt-8 sm:px-10">
                    {/* Eyebrow */}
                    <div className="mb-8 flex items-center justify-between">
                      <div>
                        <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[rgb(108,76,243)]">
                          Step by step
                        </p>
                        <p className="mt-0.5 text-[1.1rem] font-extrabold tracking-tight text-slate-950">
                          Tell us about your query
                        </p>
                      </div>
                      {/* Progress dots */}
                      <div className="flex items-center gap-1.5">
                        {[nameDone, emailDone, topicDone, messageDone].map((done, i) => (
                          <span key={i} className={["block rounded-full transition-all duration-300", done ? "h-2 w-2 bg-[rgb(108,76,243)]" : "h-2 w-2 bg-slate-200"].join(" ")} />
                        ))}
                      </div>
                    </div>

                    {/* Honeypot */}
                    <input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

                    {/* Step 1 — Name */}
                    <ConvoStep n={1} label="What's your name?" hint="We'll use this in our reply." done={nameDone}>
                      <input
                        id="name"
                        className="input w-full text-[15px]"
                        placeholder="e.g. Jane Smith"
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        onBlur={() => touch("name")}
                        autoComplete="name"
                      />
                      {touched.name && errors.name && <FieldError>{errors.name}</FieldError>}
                    </ConvoStep>

                    {/* Step 2 — Email */}
                    <ConvoStep n={2} label="Your email address?" hint="We'll reply here — check junk too." done={emailDone}>
                      <input
                        id="email"
                        className="input w-full text-[15px]"
                        placeholder="name@email.com"
                        inputMode="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        onBlur={() => touch("email")}
                      />
                      {touched.email && errors.email && <FieldError>{errors.email}</FieldError>}
                    </ConvoStep>

                    {/* Step 3 — Topic */}
                    <ConvoStep n={3} label="What's this about?" done={topicDone}>
                      <div className="flex flex-wrap gap-2">
                        {TOPICS.map(t => {
                          const active = form.topic === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setForm(p => ({ ...p, topic: t }))}
                              className={[
                                "rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-150",
                                active
                                  ? "border-[rgb(108,76,243)] bg-[rgb(108,76,243)] !text-white shadow-[0_4px_14px_rgba(108,76,243,0.22)]"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-[rgba(108,76,243,0.35)] hover:text-[rgb(108,76,243)]",
                              ].join(" ")}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </ConvoStep>

                    {/* Step 4 — Policy ref (optional, only if relevant topic) */}
                    {(form.topic === "Documents" || form.topic === "Policy retrieval") && (
                      <ConvoStep n={4} label="Policy reference?" hint="Add this if your query relates to an existing policy." done={form.policyRef.trim().length > 0}>
                        <input
                          id="policyRef"
                          className="input w-full max-w-[280px] uppercase tracking-[0.06em] text-[15px]"
                          placeholder="e.g. CVZ-AB12CD34"
                          value={form.policyRef}
                          onChange={e => setForm(p => ({ ...p, policyRef: e.target.value }))}
                        />
                      </ConvoStep>
                    )}

                    {/* Step 5 — Message */}
                    <ConvoStep n={form.topic === "Documents" || form.topic === "Policy retrieval" ? 5 : 4} label="What's happening?" hint="The more detail, the faster we can help." done={messageDone}>
                      <textarea
                        id="message"
                        className="input min-h-[140px] w-full resize-y text-[15px]"
                        placeholder="Tell us what happened, what you expected, and what you saw instead."
                        value={form.message}
                        onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                        onBlur={() => touch("message")}
                      />
                      {touched.message && errors.message && <FieldError>{errors.message}</FieldError>}
                      {!errors.message && (
                        <p className="mt-2 text-[12px] text-slate-400">Include your device or browser if something looked broken.</p>
                      )}
                    </ConvoStep>

                  </div>

                  {/* ── Send strip ── */}
                  <div className="border-t border-slate-100 bg-slate-50/50 px-7 py-5 sm:px-10">
                    {errorMsg && (
                      <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                        {errorMsg}
                      </div>
                    )}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="submit"
                        disabled={!canSend}
                        className="inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-[rgb(108,76,243)] px-8 text-[15px] font-semibold !text-white shadow-[0_12px_36px_rgba(108,76,243,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[rgb(96,66,225)] hover:shadow-[0_16px_44px_rgba(108,76,243,0.36)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
                      >
                        {status === "sending" ? (
                          <>
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 60" strokeLinecap="round" />
                            </svg>
                            Sending…
                          </>
                        ) : (
                          <>
                            Send message
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                              <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </>
                        )}
                      </button>
                      <p className="text-[12px] text-slate-400">
                        By contacting us, you agree we can reply by email.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* ════════════ SIDEBAR ════════════ */}
          <div className="grid gap-4">

            {/* Contact info */}
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(108,76,243,0.05)]">
              <div className="divide-y divide-slate-100">
                <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-start gap-3.5 px-5 py-4 transition hover:bg-slate-50/60">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(108,76,243,0.14)] bg-[rgba(108,76,243,0.07)] text-[rgb(108,76,243)]">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2.5" y="5" width="15" height="11" rx="2.5" />
                      <path d="M2.5 7.5 10 12l7.5-4.5" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-400">Email</p>
                    <p className="mt-0.5 text-[13.5px] font-semibold text-slate-900">{SUPPORT_EMAIL}</p>
                    <p className="mt-0.5 text-[12px] text-slate-400">Usually within one business day</p>
                  </div>
                </a>
                <div className="flex items-start gap-3.5 px-5 py-4">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(108,76,243,0.14)] bg-[rgba(108,76,243,0.07)] text-[rgb(108,76,243)]">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="10" cy="10" r="7.5" />
                      <path d="M10 6.5v4l2.5 1.5" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-400">Hours</p>
                    <p className="mt-0.5 text-[13.5px] font-semibold text-slate-900">Mon–Sat, 9am–7pm</p>
                    <p className="mt-0.5 text-[12px] text-slate-400">Closed Sundays &amp; bank holidays</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Faster options */}
            <div className="overflow-hidden rounded-[1.75rem] border border-[rgba(108,76,243,0.10)] bg-[rgba(108,76,243,0.04)] p-5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[rgb(108,76,243)]/60">Faster options</p>
              <p className="mt-1 text-[14px] font-extrabold tracking-tight text-slate-950">Before you message</p>
              <p className="mt-1.5 text-[12.5px] leading-snug text-slate-500">Most document issues resolve instantly — no wait needed.</p>
              <div className="mt-4 grid gap-2">
                {[
                  { label: "Retrieve policy", href: "/retrieve-policy" },
                  { label: "Help & Support", href: "/help-support" },
                  { label: "FAQs", href: "/more/faq" },
                ].map(({ label, href }) => (
                  <Link key={href} href={href} className="flex items-center justify-between rounded-[1rem] border border-[rgba(108,76,243,0.14)] bg-white px-4 py-3 text-[13.5px] font-semibold text-slate-900 transition hover:border-[rgba(108,76,243,0.30)] hover:shadow-[0_2px_12px_rgba(108,76,243,0.08)]">
                    {label}
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>

            {/* No policy yet */}
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-400">No policy yet?</p>
              <p className="mt-1 text-[14px] font-extrabold tracking-tight text-slate-950">Get covered in minutes</p>
              <p className="mt-1.5 text-[12.5px] leading-snug text-slate-500">From 1 hour. Documents issued instantly after payment.</p>
              <Link href="/get-quote" className="mt-4 flex items-center justify-between rounded-[1rem] bg-[rgb(108,76,243)] px-4 py-3 text-[13.5px] font-semibold !text-white shadow-[0_6px_20px_rgba(108,76,243,0.22)] transition hover:-translate-y-0.5">
                Start a quote
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER CTA — purple block, white text
      ══════════════════════════════════════════ */}
      <section className="mt-16 mb-4">
        <div className="relative overflow-hidden rounded-[2rem] bg-[rgb(108,76,243)] px-8 py-10 shadow-[0_20px_56px_rgba(108,76,243,0.22)] sm:px-10 sm:py-12">
          {/* Radial glow */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/[0.07]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/[0.05]" aria-hidden="true" />

          <div className="relative mx-auto max-w-[640px] text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">
              Already purchased
            </p>
            <h2 className="mt-2 text-[1.7rem] font-extrabold leading-[0.98] tracking-[-0.045em] !text-white sm:text-[2.2rem]">
              Need your documents right now?
            </h2>
            <p className="mt-3 text-[0.92rem] leading-[1.75] text-white/70">
              Retrieval is instant — download your certificate and statement of fact
              without waiting for a reply from us.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/retrieve-policy"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-white px-7 text-[14.5px] font-semibold text-[rgb(108,76,243)] transition hover:bg-white/92 sm:w-auto"
              >
                Retrieve policy documents
              </Link>
              <Link
                href="/help-support"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-white px-7 text-[14.5px] font-semibold text-[rgb(108,76,243)] transition hover:bg-white/92 sm:w-auto"
              >
                Help &amp; support
              </Link>
            </div>
          </div>
        </div>
      </section>

    </PageShell>
  );
}