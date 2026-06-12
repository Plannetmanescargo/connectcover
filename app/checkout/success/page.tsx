import Link from "next/link";
import PageShell from "@/components/site/PageShell";
import { prisma } from "@/db/prisma";
import AutoRefresh from "./AutoRefresh";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */

function fmt(d: Date) {
  return new Date(d).toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function vehicleLine(p: {
  vrm: string;
  make: string | null;
  model: string | null;
  year: string | null;
}) {
  const mm = [p.make, p.model].filter(Boolean).join(" ");
  return `${p.vrm}${mm ? ` · ${mm}` : ""}${p.year ? ` · ${p.year}` : ""}`;
}

/* ─────────────────────────────────────────────────────────
   Atoms
───────────────────────────────────────────────────────── */

function CheckCircle() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="11" fill="rgb(108,76,243)" />
      <path d="M6.5 11.2 9.2 13.9 15.5 7.5" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
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
   Processing state
───────────────────────────────────────────────────────── */

function ProcessingView({ sessionId }: { sessionId?: string }) {
  return (
    <PageShell hideHero crumbs={[{ label: "Home", href: "/" }, { label: "Payment confirmed" }]}>
      <section className="pt-4 sm:pt-8 lg:pt-12">
        <div className="mx-auto max-w-[520px]">

          <div className="flex items-center justify-center">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-[rgba(108,76,243,0.12)]" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(108,76,243,0.10)]">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                  <circle cx="14" cy="14" r="12" stroke="rgb(108,76,243)" strokeWidth="2.5" strokeDasharray="50 28" strokeLinecap="round" className="animate-spin" style={{ transformOrigin: "50% 50%" }} />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.16)] bg-[rgba(108,76,243,0.05)] px-3.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.20em] text-[rgb(108,76,243)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
              Payment confirmed
            </div>
            <h1 className="mt-5 text-[2rem] font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-[2.6rem]">
              Finalising your policy…
            </h1>
            <p className="mt-4 text-[0.95rem] leading-[1.85] text-slate-500">
              This usually takes a few seconds. Keep this tab open and we'll update automatically when your policy is ready.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white">
            <div className="divide-y divide-slate-100">
              {[
                { label: "Payment processed",    done: true  },
                { label: "Policy being created", done: false },
                { label: "Documents generating", done: false },
                { label: "Email being sent",     done: false },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-3 px-5 py-3.5">
                  {done ? <CheckCircle /> : (
                    <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-white">
                      <span className="h-2 w-2 rounded-full bg-slate-200" />
                    </span>
                  )}
                  <span className={["text-[13.5px] font-semibold", done ? "text-slate-900" : "text-slate-400"].join(" ")}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/" className="btn-ghost w-full text-center sm:w-auto">Back to home</Link>
            <Link href="/retrieve-policy" className="btn-ghost w-full text-center sm:w-auto">Retrieve policy</Link>
          </div>

          <AutoRefresh />
        </div>
      </section>
    </PageShell>
  );
}

/* ─────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────── */

export default async function SuccessPage(props: {
  searchParams?: { session_id?: string } | Promise<{ session_id?: string }>;
}) {
  const sp        = await Promise.resolve(props.searchParams ?? {});
  const sessionId = (sp.session_id ?? "").trim();

  if (!sessionId) return <ProcessingView />;

  const policy = await prisma.policy.findUnique({
    where: {
      paymentProvider_paymentId: { paymentProvider: "STRIPE", paymentId: sessionId },
    },
    select: {
      policyNumber: true,
      email:        true,
      vrm:          true,
      make:         true,
      model:        true,
      year:         true,
      startAt:      true,
      endAt:        true,
      status:       true,
      createdAt:    true,
    },
  });

  if (!policy) return <ProcessingView sessionId={sessionId} />;

  /* ── Policy confirmed ── */
  return (
    <PageShell hideHero crumbs={[{ label: "Home", href: "/" }, { label: "Covered" }]}>

      {/* ══════════════════════════════════════════
          HERO — matches site pattern exactly
      ══════════════════════════════════════════ */}
      <section className="pt-2 sm:pt-4 lg:pt-6">
        <div className="max-w-[76rem]">

          {/* Eyebrow pill — emerald, consistent with other success states */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Cover confirmed
          </div>

          {/* Headline + wavy SVG */}
          <div className="relative mt-6 max-w-[70rem]">
            <div className="pointer-events-none absolute inset-x-0 top-[8%] -z-10 opacity-45 sm:top-[12%]">
              <svg viewBox="0 0 1200 260" className="h-[220px] w-full sm:h-[260px] lg:h-[300px]" fill="none" aria-hidden="true" preserveAspectRatio="none">
                <path d="M18 152C114 62 222 227 338 152C446 82 548 216 676 142C794 72 906 201 1026 132C1090 96 1142 105 1182 122" stroke="rgba(16,185,129,0.12)" strokeWidth="34" strokeLinecap="round" />
                <path d="M10 154C108 66 216 224 334 150C444 80 544 214 672 140C792 70 904 198 1024 130C1088 95 1140 103 1190 120" stroke="rgba(16,185,129,0.24)" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="heading-unbalanced relative max-w-[8ch] text-[3.25rem] font-extrabold leading-[0.9] tracking-[-0.07em] text-slate-950 sm:text-[4.55rem] lg:text-[5.85rem]">
              You're covered.
            </h1>
          </div>

          <p className="mt-8 max-w-[44rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
            Your policy is active and your documents have been emailed to{" "}
            <span className="font-semibold text-slate-800">{policy.email}</span>.
          </p>

          {/* Emerald dot trust row */}
          <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-700">
            {["Policy created", "Documents emailed", "Retrieval available anytime"].map(item => (
              <div key={item} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 h-px w-full bg-[linear-gradient(90deg,rgba(226,232,240,0),rgba(226,232,240,0.95),rgba(226,232,240,0))]" />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          POLICY DETAILS — two-column on desktop
      ══════════════════════════════════════════ */}
      <section className="mt-12">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">

          {/* ── Policy card ── boarding-pass ── */}
          <div className="overflow-hidden rounded-[2.25rem] border border-slate-200/70 bg-white shadow-[0_24px_80px_rgba(108,76,243,0.07),0_2px_8px_rgba(15,23,42,0.04)]">

            {/* Purple top rule */}
            <div className="h-[3px] w-full bg-[rgb(108,76,243)]" />

            {/* Policy number */}
            <div className="border-b border-slate-100 px-7 py-6 sm:px-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Policy number</p>
              <p className="mt-2 text-[2rem] font-extrabold leading-none tracking-[-0.04em] text-slate-950 sm:text-[2.4rem]">
                {policy.policyNumber}
              </p>
              <p className="mt-2 text-[12.5px] text-slate-400">
                Save this — you'll need it to retrieve your documents.
              </p>
            </div>

            {/* Detail grid */}
            <div className="grid gap-x-10 gap-y-5 px-7 py-6 sm:grid-cols-2 sm:px-8">
              <PolicyField label="Vehicle"  value={vehicleLine(policy)} wide />
              <PolicyField label="Starts"   value={fmt(policy.startAt)} />
              <PolicyField label="Ends"     value={fmt(policy.endAt)} />
              <PolicyField label="Status"   value={policy.status} />
              <PolicyField label="Email"    value={policy.email} wide />
            </div>

            {/* Dashed tear-off */}
            <div className="relative mx-7 sm:mx-8">
              <div className="border-t border-dashed border-slate-200" />
              <span className="absolute -left-10 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-200" aria-hidden="true" />
              <span className="absolute -right-10 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-200" aria-hidden="true" />
            </div>

            {/* Bottom stub */}
            <div className="bg-slate-50/50 px-7 py-4 sm:px-8">
              <p className="text-[12px] font-semibold text-slate-500">
                Documents emailed · Retrievable anytime · No-claims unaffected
              </p>
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="grid gap-4">

            {/* What to do next */}
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(108,76,243,0.05)]">
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-400">Next steps</p>
                <p className="mt-0.5 text-[14px] font-extrabold tracking-tight text-slate-950">What to do now</p>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { n: "01", label: "Check your inbox for the policy documents" },
                  { n: "02", label: "Save the certificate PDF to your device" },
                  { n: "03", label: "Keep the certificate accessible while driving" },
                ].map(({ n, label }) => (
                  <div key={n} className="flex items-center gap-4 px-5 py-3.5">
                    <span className="text-[11px] font-bold tabular-nums text-[rgb(108,76,243)]/50">{n}</span>
                    <span className="text-[13.5px] font-semibold text-slate-700">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="grid gap-2.5">
              <Link
                href="/retrieve-policy"
                className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[rgb(108,76,243)] px-8 text-[15px] font-semibold !text-white shadow-[0_12px_36px_rgba(108,76,243,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[rgb(96,66,225)] hover:shadow-[0_16px_44px_rgba(108,76,243,0.36)]"
              >
                Retrieve policy
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-[15px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Back to home
              </Link>
            </div>

            {/* MID note */}
            <p className="text-center text-[12px] leading-[1.7] text-slate-400">
              MID records update several times daily — allow a few hours for your cover to appear.
              Can't find the email? Check junk or use Retrieve policy.
            </p>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER CTA — purple block, white text
          relative positioning fixes the absolute
          child overflow on the orb decorations
      ══════════════════════════════════════════ */}
      <section className="mt-16 mb-4">
        <div className="relative overflow-hidden rounded-[2rem] bg-[rgb(108,76,243)] px-8 py-10 shadow-[0_20px_56px_rgba(108,76,243,0.22)] sm:px-10 sm:py-12">
          {/* Decorative orbs */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/[0.07]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/[0.05]" aria-hidden="true" />

          <div className="relative mx-auto max-w-[640px] text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">
              Always available
            </p>
            <h2 className="mt-2 text-[1.7rem] font-extrabold leading-[0.98] tracking-[-0.045em] !text-white sm:text-[2.2rem]">
              Need your documents later?
            </h2>
            <p className="mt-3 text-[0.92rem] leading-[1.75] text-white/70">
              Retrieve your policy and download your documents again at any time — no need to contact us.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/retrieve-policy"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-white px-7 text-[14.5px] font-semibold text-[rgb(108,76,243)] transition hover:bg-white/92 sm:w-auto"
              >
                Retrieve policy
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