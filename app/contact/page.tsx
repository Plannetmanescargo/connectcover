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

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function FieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500"
    >
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={classNames(
        "input",
        "mt-2",
        props.className
      )}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={classNames(
        "textarea",
        "mt-2 min-h-[170px]",
        props.className
      )}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={classNames(
        "select",
        "mt-2",
        props.className
      )}
    />
  );
}

function InfoCard({
  title,
  value,
  helper,
  icon,
  href,
}: {
  title: string;
  value: string;
  helper?: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <div className="rounded-[1.35rem] border border-slate-200/80 bg-white/84 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {title}
          </div>
          <div className="mt-2 text-[1.04rem] font-semibold tracking-[-0.02em] text-slate-950 break-words">
            {value}
          </div>
          {helper ? (
            <p className="mt-3 text-sm leading-7 text-slate-600">{helper}</p>
          ) : null}
        </div>

        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-900 shadow-sm">
          {icon}
        </span>
      </div>
    </div>
  );

  if (!href) return inner;

  return (
    <a
      href={href}
      className="block rounded-[1.35rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(108,76,243,0.14)]"
    >
      {inner}
    </a>
  );
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export default function ContactPage() {
  const SUPPORT_EMAIL = "support@coverza.com";

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    topic: "General",
    policyRef: "",
    message: "",
    website: "",
  });

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (!form.name.trim()) e.name = "Please enter your name.";
    if (!isEmail(form.email)) e.email = "Please enter a valid email address.";
    if (!form.message.trim() || form.message.trim().length < 12) {
      e.message = "Please add a little more detail.";
    }

    return e;
  }, [form]);

  const canSend = status !== "sending" && Object.keys(errors).length === 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (form.website.trim()) {
      setStatus("sent");
      return;
    }

    if (!canSend) {
      setStatus("error");
      setErrorMsg("Please check the form — a couple of fields still need attention.");
      return;
    }

    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("sent");
        return;
      }

      throw new Error("No API route yet");
    } catch {
      const subject = encodeURIComponent(`[Coverza] ${form.topic} — ${form.name}`);
      const lines = [
        `Name: ${form.name}`,
        `Email: ${form.email}`,
        `Topic: ${form.topic}`,
        form.policyRef.trim() ? `Policy reference: ${form.policyRef.trim()}` : "",
        "",
        form.message.trim(),
      ].filter(Boolean);

      const body = encodeURIComponent(lines.join("\n"));
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
      setStatus("sent");
    }
  }

  return (
    <PageShell
      hideHero
      crumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
    >
      {/* HERO */}
      <section className="pt-2 sm:pt-4 lg:pt-6">
        <div className="max-w-[76rem]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.14)] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
            Contact support
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

            <h1 className="heading-unbalanced relative max-w-[12ch] text-[3.25rem] font-extrabold leading-[0.9] tracking-[-0.07em] text-slate-950 sm:max-w-[11ch] sm:text-[4.55rem] lg:max-w-[10.5ch] lg:text-[5.85rem]">
              Tell us what you need and we’ll guide you
            </h1>
          </div>

          <p className="mt-10 max-w-[54rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
            Use the form for help with documents, retrieval, timings, eligibility,
            or anything that looks incorrect. If you already purchased cover, have
            your policy reference ready.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/retrieve-policy" className="btn-primary btn-primary-lg !text-white">
              Retrieve policy
            </Link>

            <Link href="/help-support" className="btn-ghost">
              Help & Support
            </Link>

            <Link href="/more/faq" className="btn-ghost">
              View FAQs
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-700">
            {[
              "Fast responses",
              "Clear next steps",
              "Support when needed",
            ].map((item) => (
              <div key={item} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 h-px w-full bg-[linear-gradient(90deg,rgba(226,232,240,0),rgba(226,232,240,0.95),rgba(226,232,240,0))]" />
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="mt-16">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_320px] xl:items-start">
          {/* FORM */}
          <div className="rounded-[1.9rem] border border-slate-200/80 bg-white/88 p-6 shadow-sm sm:p-8">
            <div className="max-w-[42rem]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Send a message
              </div>

              <h2 className="mt-3 text-[1.9rem] font-extrabold leading-[0.96] tracking-[-0.045em] text-slate-950 sm:text-[2.35rem]">
                Contact the team directly
              </h2>

              <p className="mt-4 text-[1rem] leading-8 text-slate-600">
                We’ll reply by email. Include a policy reference if you already
                purchased cover.
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-8 grid gap-5">
              <input
                value={form.website}
                onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name ? <div className="field-error">{errors.name}</div> : null}
                </div>

                <div>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    aria-invalid={!!errors.email}
                    inputMode="email"
                    autoComplete="email"
                  />
                  {errors.email ? <div className="field-error">{errors.email}</div> : null}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <FieldLabel htmlFor="topic">Topic</FieldLabel>
                  <Select
                    id="topic"
                    value={form.topic}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        topic: e.target.value as FormState["topic"],
                      }))
                    }
                  >
                    <option value="General">General</option>
                    <option value="Documents">Documents</option>
                    <option value="Policy retrieval">Policy retrieval</option>
                    <option value="Quote issue">Quote issue</option>
                    <option value="Eligibility">Eligibility</option>
                    <option value="Other">Other</option>
                  </Select>
                </div>

                <div>
                  <FieldLabel htmlFor="policyRef">Policy reference (optional)</FieldLabel>
                  <Input
                    id="policyRef"
                    placeholder="e.g. CC-123456"
                    value={form.policyRef}
                    onChange={(e) => setForm((p) => ({ ...p, policyRef: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="message">Message</FieldLabel>
                <Textarea
                  id="message"
                  placeholder="Tell us what happened, what you were trying to do, and what you expected to see."
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  aria-invalid={!!errors.message}
                />
                {errors.message ? (
                  <div className="field-error">{errors.message}</div>
                ) : (
                  <div className="field-help">
                    Tip: include your device or browser if something looked broken.
                  </div>
                )}
              </div>

              {errorMsg ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMsg}
                </div>
              ) : null}

              {status === "sent" ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Sent — if a mail client opened, just hit send. If not, you can
                  email us directly at{" "}
                  <a className="link font-medium" href={`mailto:${SUPPORT_EMAIL}`}>
                    {SUPPORT_EMAIL}
                  </a>
                  .
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={!canSend}
                  className={classNames(
                    "btn-primary inline-flex justify-center !text-white",
                    !canSend && "cursor-not-allowed opacity-60"
                  )}
                >
                  {status === "sending" ? "Sending…" : "Send message"}
                </button>

                <div className="text-[12px] text-slate-500">
                  By contacting us, you agree we can reply by email.
                </div>
              </div>
            </form>
          </div>

          {/* SIDEBAR */}
          <div className="grid gap-4">
            <InfoCard
              title="Email"
              value="support@coverza.com"
              helper="We usually reply within one business day."
              icon={<IconMail />}
              href="mailto:support@coverza.com"
            />

            <InfoCard
              title="Opening hours"
              value="Mon–Sat, 9am–7pm"
              helper="Closed Sundays & bank holidays."
              icon={<IconClock />}
            />

            <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/84 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Before you message
              </div>

              <div className="mt-4 grid gap-3">
                <Link href="/retrieve-policy" className="btn-primary w-full justify-center !text-white">
                  Retrieve policy
                </Link>

                <Link href="/help-support" className="btn-ghost w-full justify-center">
                  Help & Support
                </Link>

                <Link href="/more/faq" className="btn-ghost w-full justify-center">
                  FAQs
                </Link>
              </div>

              <div className="mt-5 text-[12px] leading-6 text-slate-500">
                Most document-related issues are resolved instantly through retrieval.
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/84 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Quick route
              </div>

              <div className="mt-2 text-sm font-semibold text-slate-950">
                Have not purchased yet?
              </div>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                The fastest route is usually to start a quote and review your details
                before payment.
              </p>

              <div className="mt-4">
                <Link href="/get-quote" className="btn-ghost w-full justify-center">
                  Start a quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mt-16">
        <div className="rounded-[2rem] border border-[rgba(108,76,243,0.10)] bg-[linear-gradient(180deg,rgba(245,242,255,0.72),rgba(255,255,255,0.94))] px-6 py-10 shadow-sm sm:px-8 sm:py-12 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="heading-unbalanced text-center text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:text-[3.8rem]">
              Already bought cover?
            </h2>

            <div className="mx-auto mt-5 max-w-[38rem]">
              <p className="text-center text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
                Retrieval is instant and usually avoids the need to wait for a reply.
              </p>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/retrieve-policy" className="btn-primary !text-white">
                Retrieve policy documents
              </Link>

              <Link href="/help-support" className="btn-ghost">
                Help & Support
              </Link>
            </div>

            <div className="mt-5 text-[12px] leading-6 text-slate-500">
              Clear next steps, document access, and support when needed.
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

/* =========================================================
   Inline icons
========================================================= */

function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 7.5A2.5 2.5 0 0 1 7 5h10a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 17 19H7a2.5 2.5 0 0 1-2.5-2.5v-9Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M6.8 8.2 12 12l5.2-3.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}