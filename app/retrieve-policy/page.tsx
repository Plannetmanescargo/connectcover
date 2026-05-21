"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/site/PageShell";

function normaliseEmail(v: string) {
  return v.trim().toLowerCase();
}

function normalisePolicyNumber(v: string) {
  return v.trim().toUpperCase().replace(/\s+/g, "");
}

type RetrievePolicyResponse = {
  ok?: boolean;
  certificateUrl?: string;
  policy?: {
    policyNumber: string;
    email: string;
    vrm: string;
    make: string | null;
    model: string | null;
    year: string | null;
    startAt: string | Date;
    endAt: string | Date;
  };
  error?: string;
};

function fmt(dt: string | Date) {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function vehicleLine(p?: RetrievePolicyResponse["policy"] | null) {
  if (!p) return "—";
  const mm = [p.make, p.model].filter(Boolean).join(" ");
  return `${p.vrm}${mm ? ` • ${mm}` : ""}${p.year ? ` • ${p.year}` : ""}`;
}

function MetaInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-950">{value}</div>
    </div>
  );
}

export default function RetrievePolicyPage() {
  const [policyNumber, setPolicyNumber] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [policy, setPolicy] = useState<RetrievePolicyResponse["policy"] | null>(null);

  const canSubmit = useMemo(() => {
    const pn = normalisePolicyNumber(policyNumber);
    const em = normaliseEmail(email);
    return pn.length >= 6 && em.includes("@") && em.includes(".");
  }, [policyNumber, email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setCertificateUrl(null);
    setPolicy(null);

    const pn = normalisePolicyNumber(policyNumber);
    const em = normaliseEmail(email);

    setLoading(true);
    try {
      const res = await fetch("/api/retrieve-policy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ policyNumber: pn, email: em }),
      });

      const data = (await res.json().catch(() => ({}))) as RetrievePolicyResponse;

      if (!res.ok) {
        throw new Error(data?.error || "We couldn’t resend your documents. Please try again.");
      }

      setOk(
        "If we found a matching policy, we’ve re-sent your documents. Please check your inbox and junk folder."
      );

      setCertificateUrl(data?.certificateUrl ?? null);
      setPolicy(data?.policy ?? null);

      setPolicyNumber(pn);
      setEmail(em);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell
      hideHero
      crumbs={[{ label: "Home", href: "/" }, { label: "Retrieve policy" }]}
    >
      {/* HERO */}
      <section className="pt-2 sm:pt-4 lg:pt-6">
        <div className="max-w-[76rem]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.14)] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
            Retrieve policy
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
              Get your documents again, quickly
            </h1>
          </div>

          <p className="mt-10 max-w-[54rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
            Enter your policy number and the email used at checkout to request your
            documents again. If we find a match, we’ll resend them straight away.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/help-support" className="btn-ghost">
              Help & Support
            </Link>

            <Link href="/more/faq" className="btn-ghost">
              View FAQs
            </Link>

            <Link href="/get-quote" className="btn-ghost">
              Get a new quote
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-700">
            {[
              "Instant document resend",
              "No account needed",
              "Support if you need it",
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

      {/* FORM + SIDEBAR */}
      <section className="mt-16">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_320px] xl:items-start">
          <div className="rounded-[1.9rem] border border-slate-200/80 bg-white/88 p-6 shadow-sm sm:p-8">
            <div className="max-w-[42rem]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                What you’ll need
              </div>

              <h2 className="mt-3 text-[1.9rem] font-extrabold leading-[0.96] tracking-[-0.045em] text-slate-950 sm:text-[2.35rem]">
                Request your documents again
              </h2>

              <p className="mt-4 text-[1rem] leading-8 text-slate-600">
                Use the policy number from your confirmation or existing documents,
                together with the same email address used when purchasing.
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-8 grid gap-5">
              <div>
                <label className="label" htmlFor="policyNumber">
                  Policy number
                </label>
                <input
                  id="policyNumber"
                  className="input"
                  placeholder="e.g. CC-26-AB12CD34"
                  value={policyNumber}
                  onChange={(e) => {
                    setPolicyNumber(e.target.value);
                    setErr(null);
                    setOk(null);
                    setCertificateUrl(null);
                    setPolicy(null);
                  }}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <div className="field-help">
                  Found on your confirmation email or PDF documents.
                </div>
              </div>

              <div>
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  className="input"
                  placeholder="e.g. name@email.com"
                  inputMode="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErr(null);
                    setOk(null);
                    setCertificateUrl(null);
                    setPolicy(null);
                  }}
                />
                <div className="field-help">
                  This should match the email used when purchasing.
                </div>
              </div>

              {err ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <div className="font-extrabold">Action needed</div>
                  <div className="mt-1">{err}</div>
                </div>
              ) : null}

              {ok ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <div className="font-extrabold">Sent</div>
                  <div className="mt-1">{ok}</div>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className={`btn-primary inline-flex justify-center !text-white ${(!canSubmit || loading) ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  {loading ? "Resending…" : "Resend documents"}
                </button>

                <div className="text-[12px] text-slate-500">
                  Tip: emails can take 1–2 minutes. Check junk or spam too.
                </div>
              </div>
            </form>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/84 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Before you start
              </div>

              <div className="mt-4 grid gap-3">
                {[
                  "Use the same email address as checkout",
                  "Check your policy number carefully",
                  "Look in junk or spam after requesting",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-[1rem] border border-slate-200/80 bg-slate-50/60 px-4 py-3"
                  >
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                    <div className="text-sm leading-7 text-slate-700">{item}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/84 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Need help?
              </div>

              <div className="mt-2 text-[1.04rem] font-semibold tracking-[-0.02em] text-slate-950">
                support@Coverza.com
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                If you are still stuck after trying retrieval, our support team can help.
              </p>

              <div className="mt-4">
                <a
                  href="mailto:support@Coverza.com"
                  className="btn-ghost w-full justify-center"
                >
                  Email support
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OPTIONAL RESULT */}
      {(policy || certificateUrl) ? (
        <section className="mt-16">
          <div className="rounded-[1.9rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(245,242,255,0.72),rgba(255,255,255,0.96))] p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Certificate preview
                </div>

                <h2 className="mt-3 max-w-[16ch] text-[1.9rem] font-extrabold leading-[0.96] tracking-[-0.045em] text-slate-950 sm:text-[2.35rem]">
                  Your policy details and document preview
                </h2>

                <p className="mt-4 max-w-[38rem] text-[1rem] leading-8 text-slate-600">
                  If available, your certificate and basic policy details will appear here.
                </p>
              </div>

              {certificateUrl ? (
                <a
                  className="btn-ghost"
                  href={certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download certificate
                </a>
              ) : (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700">
                  Not available yet
                </span>
              )}
            </div>

            {policy ? (
              <div className="mt-8 rounded-[1.5rem] border border-slate-200/80 bg-white/84 p-5 sm:p-6">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <MetaInfo label="Policy number" value={policy.policyNumber} />
                  <MetaInfo label="Vehicle" value={vehicleLine(policy)} />
                  <MetaInfo label="Start" value={fmt(policy.startAt)} />
                  <MetaInfo label="End" value={fmt(policy.endAt)} />
                </div>
              </div>
            ) : null}

            {certificateUrl ? (
              <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/84">
                <div className="h-[70vh]">
                  <iframe
                    title="Certificate preview"
                    src={certificateUrl}
                    className="h-full w-full"
                  />
                </div>
              </div>
            ) : (
              <div className="mt-6 text-[12px] leading-6 text-slate-500">
                If your policy is still being finalised, try again in a minute — or
                check your inbox first.
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* FINAL CTA */}
      <section className="mt-16">
        <div className="rounded-[2rem] border border-[rgba(108,76,243,0.10)] bg-[linear-gradient(180deg,rgba(245,242,255,0.72),rgba(255,255,255,0.94))] px-6 py-10 shadow-sm sm:px-8 sm:py-12 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="heading-unbalanced text-center text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:text-[3.8rem]">
              Still cannot find your documents?
            </h2>

            <div className="mx-auto mt-5 max-w-[38rem]">
              <p className="text-center text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
                If retrieval does not solve it, support can help guide you to the right next step.
              </p>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/help-support" className="btn-ghost">
                Help & Support
              </Link>

              <Link href="/contact" className="btn-ghost">
                Contact support
              </Link>
            </div>

            <div className="mt-5 text-[12px] leading-6 text-slate-500">
              Instant retrieval first, support when needed.
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}