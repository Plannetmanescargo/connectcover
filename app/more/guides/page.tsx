// app/more/guides/page.tsx
"use client";

import Link from "next/link";
import PageShell from "@/components/site/PageShell";
import React from "react";

/* =========================================================
   Data
========================================================= */

type Guide = {
  title: string;
  desc: string;
  href: string;
  label: string;
  bullets: string[];
  accent?: "blue" | "sky" | "indigo" | "violet";
};

const guides: readonly Guide[] = [
  {
    title: "Temporary car insurance guide",
    label: "Car",
    desc: "How short-term car cover works, what you’ll need, and how to choose the right duration for your plans.",
    href: "/car",
    bullets: ["Choose exact times", "Instant documents", "Clear pricing"],
    accent: "blue",
  },
  {
    title: "Learner insurance guide",
    label: "Learner",
    desc: "Short-term learner cover for practice sessions, with clear guidance on supervision and documents.",
    href: "/learner",
    bullets: ["Practice sessions", "Document access", "Simple steps"],
    accent: "sky",
  },
  {
    title: "Temporary van insurance guide",
    label: "Van",
    desc: "Useful for moves, jobs or borrowing a van, with a clearer view of what to check before cover starts.",
    href: "/van",
    bullets: ["Moves & jobs", "Short durations", "No long contracts"],
    accent: "indigo",
  },
  {
    title: "Impound insurance guide",
    label: "Impound",
    desc: "A practical guide to impound cover, release needs, next steps and document access.",
    href: "/impound",
    bullets: ["Release requirements", "Document retrieval", "Clear guidance"],
    accent: "violet",
  },
] as const;

/* =========================================================
   UI
========================================================= */

function GuideTile({
  title,
  desc,
  href,
  label,
  bullets,
  accent = "blue",
}: Guide) {
  const accentMap: Record<string, string> = {
    blue: "from-blue-700 to-sky-500",
    sky: "from-sky-500 to-cyan-500",
    indigo: "from-indigo-700 to-blue-600",
    violet: "from-violet-700 to-indigo-600",
  };

  return (
    <Link
      href={href}
      className="group rounded-[1.8rem] border border-slate-200/80 bg-white/88 p-6 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={[
                "inline-flex h-10 items-center rounded-full bg-gradient-to-r px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm",
                accentMap[accent],
              ].join(" ")}
            >
              {label}
            </span>

            <span className="text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true">
              →
            </span>
          </div>

          <h3 className="mt-4 text-[1.08rem] font-semibold tracking-[-0.02em] text-slate-950 sm:text-[1.18rem]">
            {title}
          </h3>

          <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
            {desc}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        {bullets.map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm font-semibold text-slate-950">
        Explore guide
      </div>
    </Link>
  );
}

function QuickAction({
  title,
  desc,
  href,
  cta,
  primary = false,
}: {
  title: string;
  desc: string;
  href: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <div className="rounded-[1.45rem] border border-slate-200/80 bg-white/84 p-5">
      <div className="text-[1rem] font-semibold tracking-[-0.02em] text-slate-950">
        {title}
      </div>
      <p className="mt-2 text-sm leading-7 text-slate-600">{desc}</p>

      <div className="mt-5">
        <Link href={href} className={primary ? "btn-primary !text-white" : "btn-ghost"}>
          {cta}
        </Link>
      </div>
    </div>
  );
}

/* =========================================================
   Page
========================================================= */

export default function GuidesPage() {
  return (
    <PageShell
      hideHero
      crumbs={[
        { label: "Home", href: "/" },
        { label: "More", href: "/more" },
        { label: "Guides" },
      ]}
    >
      {/* HERO */}
      <section className="pt-2 sm:pt-4 lg:pt-6">
        <div className="max-w-[76rem]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.14)] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
            Guides
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

            <h1 className="heading-unbalanced relative max-w-[11ch] text-[3.25rem] font-extrabold leading-[0.9] tracking-[-0.07em] text-slate-950 sm:max-w-[10ch] sm:text-[4.55rem] lg:max-w-[9.5ch] lg:text-[5.85rem]">
              Practical guides, kept clear
            </h1>
          </div>

          <p className="mt-10 max-w-[54rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
            Step into the right guide for car, van, learner or impound cover and
            get a clearer understanding of what to expect before you start.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/get-quote" className="btn-primary btn-primary-lg !text-white">
              Start your quote
            </Link>

            <Link href="/more/faq" className="btn-ghost">
              Browse FAQs
            </Link>

            <Link href="/help-support" className="btn-ghost">
              Help & Support
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-700">
            {["Fast to scan", "Clear next steps", "Built around real journeys"].map((item) => (
              <div key={item} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 h-px w-full bg-[linear-gradient(90deg,rgba(226,232,240,0),rgba(226,232,240,0.95),rgba(226,232,240,0))]" />
        </div>
      </section>

      {/* GUIDES */}
      <section className="mt-16">
        <div className="max-w-[56rem]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)]">
            Featured guides
          </div>

          <h2 className="mt-4 max-w-[14ch] text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:max-w-[13ch] lg:text-[4rem]">
            Start with the guide that fits
          </h2>

          <p className="mt-4 max-w-[44rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
            Each guide is designed to help you understand the journey more clearly
            before you move into a quote.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {guides.map((guide) => (
            <GuideTile key={guide.title} {...guide} />
          ))}
        </div>
      </section>

      {/* QUICK ROUTES */}
      <section className="mt-16">
        <div className="rounded-[1.9rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(245,242,255,0.88),rgba(255,255,255,0.96))] p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="max-w-[56rem]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Quick routes
            </div>

            <h2 className="mt-3 max-w-[16ch] text-[1.9rem] font-extrabold leading-[0.96] tracking-[-0.045em] text-slate-950 sm:text-[2.35rem]">
              Need an answer or document right now?
            </h2>

            <p className="mt-4 max-w-[38rem] text-[1rem] leading-8 text-slate-600">
              If you do not need a guide right now, jump straight to FAQs, policy
              retrieval or help and support.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <QuickAction
              title="FAQs"
              desc="Browse clear answers on cover, eligibility, documents and timings."
              href="/more/faq"
              cta="Browse FAQs"
            />

            <QuickAction
              title="Retrieve policy"
              desc="Access your policy documents again without starting over."
              href="/retrieve-policy"
              cta="Retrieve policy"
              primary
            />

            <QuickAction
              title="Help & Support"
              desc="Go straight to support if you are stuck or need guidance."
              href="/help-support"
              cta="Go to support"
            />
          </div>
        </div>
      </section>

      {/* FINAL REASSURANCE */}
      <section className="mt-16">
        <div className="flex flex-col gap-2 text-[12px] text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
          {[
            "Helpful routes built around real journeys",
            "Always read your policy documents carefully",
            "You’ll review details before payment",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}