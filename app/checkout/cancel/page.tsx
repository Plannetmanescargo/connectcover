"use client";

import Link from "next/link";
import PageShell from "@/components/site/PageShell";

export default function CancelPage() {
  return (
    <PageShell
      hideHero
      crumbs={[{ label: "Home", href: "/" }, { label: "Checkout cancelled" }]}
    >
      {/* HERO */}
      <section className="pt-2 sm:pt-4 lg:pt-6">
        <div className="max-w-[76rem]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.14)] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
            Checkout cancelled
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

            <h1 className="heading-unbalanced relative max-w-[10ch] text-[3.25rem] font-extrabold leading-[0.9] tracking-[-0.07em] text-slate-950 sm:max-w-[9ch] sm:text-[4.55rem] lg:max-w-[8.5ch] lg:text-[5.85rem]">
              No charge was made
            </h1>
          </div>

          <p className="mt-10 max-w-[54rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
            Your payment was cancelled before checkout completed. You can return to
            your quote and try again whenever you are ready.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/get-quote" className="btn-primary btn-primary-lg !text-white">
              Return to quote
            </Link>

            <Link href="/retrieve-policy" className="btn-ghost">
              Retrieve policy
            </Link>

            <Link href="/" className="btn-ghost">
              Back to home
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-700">
            {[
              "No payment taken",
              "You can try again anytime",
              "Support available if needed",
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

      {/* QUICK ROUTES */}
      <section className="mt-16">
        <div className="rounded-[1.9rem] border border-slate-200/80 bg-white/88 p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="max-w-[56rem]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Quick routes
            </div>

            <h2 className="mt-3 max-w-[15ch] text-[1.9rem] font-extrabold leading-[0.96] tracking-[-0.045em] text-slate-950 sm:text-[2.35rem]">
              What to do next
            </h2>

            <p className="mt-4 max-w-[38rem] text-[1rem] leading-8 text-slate-600">
              You can return to your quote to review the details again, or head to
              policy retrieval if you believe you already completed payment earlier.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/60 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Quote
              </div>
              <div className="mt-2 text-[1.04rem] font-semibold tracking-[-0.02em] text-slate-950">
                Review your dates and price again
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Go back through the quote journey if you want to check timings or try payment again.
              </p>
              <div className="mt-5">
                <Link href="/get-quote" className="btn-primary w-full justify-center !text-white">
                  Return to quote
                </Link>
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/60 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Retrieval
              </div>
              <div className="mt-2 text-[1.04rem] font-semibold tracking-[-0.02em] text-slate-950">
                Already paid before?
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                If you think payment already completed, try retrieving your policy documents first.
              </p>
              <div className="mt-5">
                <Link href="/retrieve-policy" className="btn-ghost w-full justify-center">
                  Retrieve policy
                </Link>
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/60 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Home
              </div>
              <div className="mt-2 text-[1.04rem] font-semibold tracking-[-0.02em] text-slate-950">
                Leave the checkout journey
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Head back to the homepage if you want to browse the rest of Connect Cover again.
              </p>
              <div className="mt-5">
                <Link href="/" className="btn-ghost w-full justify-center">
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUPPORT */}
      <section className="mt-16">
        <div className="rounded-[1.9rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(245,242,255,0.72),rgba(255,255,255,0.96))] p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Need help?
              </div>

              <h2 className="mt-3 max-w-[16ch] text-[1.9rem] font-extrabold leading-[0.96] tracking-[-0.045em] text-slate-950 sm:text-[2.35rem]">
                Support is easy to reach
              </h2>

              <p className="mt-4 max-w-[38rem] text-[1rem] leading-8 text-slate-600">
                If something looked wrong during checkout or you are unsure what happened,
                our support team can help point you in the right direction.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/help-support" className="btn-ghost">
                  Help & Support
                </Link>

                <Link href="/contact" className="btn-ghost">
                  Contact support
                </Link>
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/84 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Email support
              </div>

              <div className="mt-2 text-[1.04rem] font-semibold tracking-[-0.02em] text-slate-950 break-words">
                support@connectcover.com
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Reach out if you need help with your quote, payment journey or document access.
              </p>

              <div className="mt-5">
                <a
                  href="mailto:support@connectcover.com"
                  className="btn-ghost w-full justify-center"
                >
                  Email support
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}