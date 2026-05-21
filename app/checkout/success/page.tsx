import Link from "next/link";
import PageShell from "@/components/site/PageShell";
import { prisma } from "@/db/prisma";
import AutoRefresh from "./AutoRefresh";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      <div className="mt-2 text-sm font-semibold text-slate-950 break-words">{value}</div>
    </div>
  );
}

export default async function SuccessPage(props: {
  searchParams?: { session_id?: string } | Promise<{ session_id?: string }>;
}) {
  const sp = await Promise.resolve(props.searchParams ?? {});
  const sessionId = (sp.session_id ?? "").trim();

  if (!sessionId) {
    return (
      <PageShell
        hideHero
        crumbs={[{ label: "Home", href: "/" }, { label: "Payment received" }]}
      >
        {/* HERO */}
        <section className="pt-2 sm:pt-4 lg:pt-6">
          <div className="max-w-[76rem]">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Payment received
            </div>

            <div className="relative mt-6 max-w-[70rem]">
              <div className="pointer-events-none absolute inset-x-0 top-[8%] -z-10 opacity-45 sm:top-[12%]">
                <svg
                  viewBox="0 0 1200 260"
                  className="h-[220px] w-full sm:h-[260px] lg:h-[300px]"
                  fill="none"
                  aria-hidden="true"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M18 152C114 62 222 227 338 152C446 82 548 216 676 142C794 72 906 201 1026 132C1090 96 1142 105 1182 122"
                    stroke="rgba(16,185,129,0.12)"
                    strokeWidth="34"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 154C108 66 216 224 334 150C444 80 544 214 672 140C792 70 904 198 1024 130C1088 95 1140 103 1190 120"
                    stroke="rgba(16,185,129,0.24)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h1 className="heading-unbalanced relative max-w-[11ch] text-[3.25rem] font-extrabold leading-[0.9] tracking-[-0.07em] text-slate-950 sm:max-w-[10ch] sm:text-[4.55rem] lg:max-w-[9.5ch] lg:text-[5.85rem]">
                We’re finalising your policy
              </h1>
            </div>

            <p className="mt-10 max-w-[54rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
              Your documents should be emailed shortly. Keep this tab open and we’ll
              keep checking in the background.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/" className="btn-ghost">
                Back to home
              </Link>
              <Link href="/retrieve-policy" className="btn-ghost">
                Retrieve policy
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-700">
              {[
                "Payment confirmed",
                "Documents coming shortly",
                "Retrieval available if needed",
              ].map((item) => (
                <div key={item} className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-12 h-px w-full bg-[linear-gradient(90deg,rgba(226,232,240,0),rgba(226,232,240,0.95),rgba(226,232,240,0))]" />
          </div>
        </section>

        <section className="mt-16">
          <div className="rounded-[1.9rem] border border-slate-200/80 bg-white/88 p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="max-w-[40rem]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                What happens next
              </div>
              <h2 className="mt-3 text-[1.9rem] font-extrabold leading-[0.96] tracking-[-0.045em] text-slate-950 sm:text-[2.35rem]">
                We’ll keep checking automatically
              </h2>
              <p className="mt-4 text-[1rem] leading-8 text-slate-600">
                Policy creation, document generation and email delivery usually finish
                quickly. If you still cannot find the email, retrieval is the next best step.
              </p>
            </div>

            <div className="mt-8 rounded-[1.4rem] border border-slate-200/80 bg-slate-50/60 p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {["Policy created", "Documents generated", "Email sent to inbox"].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.1rem] border border-slate-200/80 bg-white/84 px-4 py-4 text-sm font-semibold text-slate-950"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-4 text-[12px] leading-6 text-slate-500">
                If it doesn’t arrive, check junk or use Retrieve policy.
              </div>
            </div>

            <AutoRefresh />
          </div>
        </section>
      </PageShell>
    );
  }

  const policy = await prisma.policy.findUnique({
    where: {
      paymentProvider_paymentId: {
        paymentProvider: "STRIPE",
        paymentId: sessionId,
      },
    },
    select: {
      policyNumber: true,
      email: true,
      vrm: true,
      make: true,
      model: true,
      year: true,
      startAt: true,
      endAt: true,
      status: true,
      createdAt: true,
    },
  });

  if (!policy) {
    return (
      <PageShell
        hideHero
        crumbs={[{ label: "Home", href: "/" }, { label: "Payment confirmed" }]}
      >
        {/* HERO */}
        <section className="pt-2 sm:pt-4 lg:pt-6">
          <div className="max-w-[76rem]">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Payment confirmed
            </div>

            <div className="relative mt-6 max-w-[70rem]">
              <div className="pointer-events-none absolute inset-x-0 top-[8%] -z-10 opacity-45 sm:top-[12%]">
                <svg
                  viewBox="0 0 1200 260"
                  className="h-[220px] w-full sm:h-[260px] lg:h-[300px]"
                  fill="none"
                  aria-hidden="true"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M18 152C114 62 222 227 338 152C446 82 548 216 676 142C794 72 906 201 1026 132C1090 96 1142 105 1182 122"
                    stroke="rgba(16,185,129,0.12)"
                    strokeWidth="34"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 154C108 66 216 224 334 150C444 80 544 214 672 140C792 70 904 198 1024 130C1088 95 1140 103 1190 120"
                    stroke="rgba(16,185,129,0.24)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h1 className="heading-unbalanced relative max-w-[10ch] text-[3.25rem] font-extrabold leading-[0.9] tracking-[-0.07em] text-slate-950 sm:max-w-[9ch] sm:text-[4.55rem] lg:max-w-[8.5ch] lg:text-[5.85rem]">
                Finalising your policy…
              </h1>
            </div>

            <p className="mt-10 max-w-[54rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
              This usually takes a few seconds. Keep this tab open and we’ll update automatically.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/" className="btn-ghost">
                Back to home
              </Link>
              <Link href="/retrieve-policy" className="btn-ghost">
                Retrieve policy
              </Link>
            </div>

            <div className="mt-12 h-px w-full bg-[linear-gradient(90deg,rgba(226,232,240,0),rgba(226,232,240,0.95),rgba(226,232,240,0))]" />
          </div>
        </section>

        <section className="mt-16">
          <div className="rounded-[1.9rem] border border-slate-200/80 bg-white/88 p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  What happens next
                </div>
                <h2 className="mt-3 text-[1.9rem] font-extrabold leading-[0.96] tracking-[-0.045em] text-slate-950 sm:text-[2.35rem]">
                  We’re processing the final policy steps
                </h2>
                <p className="mt-4 max-w-[38rem] text-[1rem] leading-8 text-slate-600">
                  Policy creation, document generation and email delivery are still being completed.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {["Policy created", "Documents generated", "Email sent to inbox"].map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.1rem] border border-slate-200/80 bg-slate-50/60 px-4 py-4 text-sm font-semibold text-slate-950"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-[12px] leading-6 text-slate-500">
                  If it doesn’t arrive, check junk or use Retrieve policy.
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/60 p-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Session
                </div>
                <div className="mt-2 break-all text-sm font-semibold text-slate-950">
                  {sessionId}
                </div>
              </div>
            </div>

            <AutoRefresh />
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell
      hideHero
      crumbs={[{ label: "Home", href: "/" }, { label: "Success" }]}
    >
      {/* HERO */}
      <section className="pt-2 sm:pt-4 lg:pt-6">
        <div className="max-w-[76rem]">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Payment received
          </div>

          <div className="relative mt-6 max-w-[70rem]">
            <div className="pointer-events-none absolute inset-x-0 top-[8%] -z-10 opacity-45 sm:top-[12%]">
              <svg
                viewBox="0 0 1200 260"
                className="h-[220px] w-full sm:h-[260px] lg:h-[300px]"
                fill="none"
                aria-hidden="true"
                preserveAspectRatio="none"
              >
                <path
                  d="M18 152C114 62 222 227 338 152C446 82 548 216 676 142C794 72 906 201 1026 132C1090 96 1142 105 1182 122"
                  stroke="rgba(16,185,129,0.12)"
                  strokeWidth="34"
                  strokeLinecap="round"
                />
                <path
                  d="M10 154C108 66 216 224 334 150C444 80 544 214 672 140C792 70 904 198 1024 130C1088 95 1140 103 1190 120"
                  stroke="rgba(16,185,129,0.24)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h1 className="heading-unbalanced relative max-w-[8ch] text-[3.25rem] font-extrabold leading-[0.9] tracking-[-0.07em] text-slate-950 sm:max-w-[7ch] sm:text-[4.55rem] lg:max-w-[6.5ch] lg:text-[5.85rem]">
              You’re covered
            </h1>
          </div>

          <p className="mt-10 max-w-[54rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
            We’ve created your policy and emailed your documents. Make sure you save your policy number.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="btn-ghost">
              Back to home
            </Link>
            <Link href="/retrieve-policy" className="btn-primary btn-primary-lg !text-white">
              Retrieve policy
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-700">
            {[
              "Policy created",
              "Documents emailed",
              "Retrieval available anytime",
            ].map((item) => (
              <div key={item} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 h-px w-full bg-[linear-gradient(90deg,rgba(226,232,240,0),rgba(226,232,240,0.95),rgba(226,232,240,0))]" />
        </div>
      </section>

      {/* POLICY DETAILS */}
      <section className="mt-16">
        <div className="rounded-[1.9rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(245,242,255,0.72),rgba(255,255,255,0.96))] p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Policy details
              </div>
              <h2 className="mt-3 text-[1.9rem] font-extrabold leading-[0.96] tracking-[-0.045em] text-slate-950 sm:text-[2.35rem]">
                Keep these details handy
              </h2>
              <p className="mt-4 max-w-[38rem] text-[1rem] leading-8 text-slate-600">
                If you can’t see the email, check junk first and then use Retrieve policy.
              </p>
            </div>

            <div className="rounded-[1.35rem] border border-slate-200/80 bg-white/84 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Policy number
              </div>
              <div className="mt-2 text-[1.08rem] font-semibold tracking-[-0.02em] text-slate-950 break-words">
                {policy.policyNumber}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-slate-200/80 bg-white/84 p-5 sm:p-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <MetaInfo label="Policy number" value={policy.policyNumber} />
              <MetaInfo label="Email" value={policy.email} />
              <MetaInfo label="Vehicle" value={vehicleLine(policy)} />
              <MetaInfo label="Status" value={policy.status} />
              <MetaInfo label="Start" value={fmt(policy.startAt)} />
              <MetaInfo label="End" value={fmt(policy.endAt)} />
              <MetaInfo label="Created" value={fmt(policy.createdAt)} />
              <MetaInfo label="Next step" value="Check your inbox" />
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mt-16">
        <div className="rounded-[2rem] border border-[rgba(108,76,243,0.10)] bg-[linear-gradient(180deg,rgba(245,242,255,0.72),rgba(255,255,255,0.94))] px-6 py-10 shadow-sm sm:px-8 sm:py-12 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="heading-unbalanced text-center text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:text-[3.8rem]">
              Need your documents again later?
            </h2>

            <div className="mx-auto mt-5 max-w-[38rem]">
              <p className="text-center text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
                You can retrieve your policy documents again anytime without starting over.
              </p>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/retrieve-policy" className="btn-primary !text-white">
                Retrieve policy
              </Link>

              <Link href="/help-support" className="btn-ghost">
                Help & Support
              </Link>
            </div>

            <div className="mt-5 text-[12px] leading-6 text-slate-500">
              Clear confirmation, policy access, and support when needed.
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}