"use client";

import Link from "next/link";
import React from "react";
import PageShell from "@/components/site/PageShell";

/* =========================================================
   Data
========================================================= */

type ResourceCard = {
  title: string;
  desc: string;
  href: string;
  label: string;
  icon: React.ReactNode;
  bullets: readonly string[];
  accent?: "blue" | "sky" | "indigo";
  status?: "live" | "soon";
};

const resources: readonly ResourceCard[] = [
  {
    title: "FAQs",
    desc: "Clear answers on cover, eligibility, documents, timings and retrieval.",
    href: "/more/faq",
    label: "FAQs",
    icon: <IconSpark />,
    bullets: ["Eligibility & underwriting", "Documents & retrieval", "Payments & timings"],
    accent: "blue",
    status: "live",
  },
  {
    title: "Guides",
    desc: "Step-by-step guidance for learners, vans, impound journeys and more.",
    href: "/more/guides",
    label: "Guides",
    icon: <IconMap />,
    bullets: ["Learner journeys", "Impound checklists", "Short-term use cases"],
    accent: "sky",
    status: "soon",
  },
  {
    title: "Blog",
    desc: "Helpful explainers, updates and practical short-term cover insights.",
    href: "/more/blog",
    label: "Insights",
    icon: <IconDoc />,
    bullets: ["Explainers", "Updates", "Seasonal tips"],
    accent: "indigo",
    status: "soon",
  },
] as const;

const browseByProduct = [
  { title: "Car cover", href: "/car" },
  { title: "Van cover", href: "/van" },
  { title: "Learner cover", href: "/learner" },
  { title: "Impound cover", href: "/impound" },
] as const;

/* =========================================================
   UI
========================================================= */

function ResourceTile({
  title,
  desc,
  href,
  label,
  icon,
  bullets,
  accent = "blue",
  status = "live",
}: ResourceCard) {
  const safeHref = status === "soon" ? `${href}?comingSoon=1` : href;

  const accentMap: Record<string, string> = {
    blue: "from-blue-700 to-sky-500",
    sky: "from-sky-500 to-blue-700",
    indigo: "from-indigo-700 to-blue-700",
  };

  return (
    <Link
      href={safeHref}
      className={[
        "group rounded-[1.8rem] border border-slate-200/80 bg-white/88 p-6 shadow-sm transition",
        "hover:border-slate-300 hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className={[
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm",
              accentMap[accent],
            ].join(" ")}
          >
            {icon}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[1.05rem] font-semibold tracking-[-0.02em] text-slate-950">
                {title}
              </div>

              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                {label}
              </span>
            </div>

            <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
              {desc}
            </p>
          </div>
        </div>

        <span className="text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true">
          →
        </span>
      </div>

      <div className="mt-5 grid gap-2">
        {bullets.map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </Link>
  );
}

function QuickLinkPill({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}

/* =========================================================
   Page
========================================================= */

export default function MoreHubPage() {
  return (
    <PageShell
      hideHero
      crumbs={[{ label: "Home", href: "/" }, { label: "More" }]}
    >
      {/* HERO */}
      <section className="pt-2 sm:pt-4 lg:pt-6">
        <div className="max-w-[76rem]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.14)] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
            Resources
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
              More from Coverza
            </h1>
          </div>

          <p className="mt-10 max-w-[54rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
            Browse answers, guides and useful resources designed to make temporary
            insurance feel clearer from quote to documents.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/more/faq" className="btn-primary btn-primary-lg !text-white">
              Explore FAQs
            </Link>

            <Link href="/help-support" className="btn-ghost">
              Help & Support
            </Link>

            <Link href="/retrieve-policy" className="btn-ghost">
              Retrieve policy
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-700">
            {["Helpful resources", "Clear routes", "Built around real journeys"].map((item) => (
              <div key={item} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 h-px w-full bg-[linear-gradient(90deg,rgba(226,232,240,0),rgba(226,232,240,0.95),rgba(226,232,240,0))]" />
        </div>
      </section>

      {/* BROWSE BY PRODUCT */}
      <section className="mt-16">
        <div className="max-w-[56rem]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)]">
            Browse by product
          </div>

          <h2 className="mt-4 max-w-[14ch] text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:max-w-[13ch] lg:text-[4rem]">
            Jump into the right journey
          </h2>

          <p className="mt-4 max-w-[44rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
            Go straight to the product that fits what you need, whether that is car,
            van, learner or impound cover.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {browseByProduct.map((item) => (
            <QuickLinkPill key={item.title} href={item.href}>
              {item.title}
            </QuickLinkPill>
          ))}
        </div>
      </section>

      {/* RESOURCES GRID */}
      <section className="mt-16">
        <div className="max-w-[56rem]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)]">
            Browse
          </div>

          <h2 className="mt-4 max-w-[14ch] text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:max-w-[13ch] lg:text-[4rem]">
            Helpful resources in one place
          </h2>

          <p className="mt-4 max-w-[44rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
            Explore practical content across FAQs, guides and articles, with each
            route built to stay clean and easy to follow.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {resources.map((resource) => (
            <ResourceTile key={resource.title} {...resource} />
          ))}
        </div>
      </section>

      {/* SUPPORT / RETRIEVAL */}
      <section className="mt-16">
        <div className="rounded-[1.9rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(245,242,255,0.88),rgba(255,255,255,0.96))] p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Need help right now?
              </div>

              <h2 className="mt-3 max-w-[16ch] text-[1.9rem] font-extrabold leading-[0.96] tracking-[-0.045em] text-slate-950 sm:text-[2.35rem]">
                Support and policy access, kept simple
              </h2>

              <p className="mt-4 max-w-[38rem] text-[1rem] leading-8 text-slate-600">
                If you are stuck mid-journey, start with help and support. If you
                already have a policy, retrieval is the quickest route back to your
                documents.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/help-support" className="btn-ghost">
                  Go to Help & Support
                </Link>

                <Link href="/retrieve-policy" className="btn-primary !text-white">
                  Retrieve policy
                </Link>

                <Link href="/get-quote" className="btn-ghost">
                  Start a quote
                </Link>
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/84 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Support details
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Email
                  </div>
                  <div className="mt-2 text-[1.04rem] font-semibold tracking-[-0.02em] text-slate-950">
                    support@coverza.com
                  </div>
                  <div className="mt-1 text-sm leading-7 text-slate-600">
                    Usually within one business day
                  </div>
                </div>

                <div className="rounded-[1.15rem] border border-slate-200/80 bg-slate-50/60 px-4 py-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Opening hours
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-950">
                    Mon–Sat, 9am–7pm
                  </div>
                  <div className="mt-1 text-sm leading-6 text-slate-600">
                    Closed Sundays & bank holidays
                  </div>
                </div>
              </div>
            </div>
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

/* =========================================================
   Icons
========================================================= */

function IconDoc() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3h7l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2" />
      <path d="M8 13h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconMap() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 18 3.8 20.2A1 1 0 0 1 2.5 19.3V6.2a1 1 0 0 1 .7-1l5.8-2.1A2 2 0 0 1 10 3v15a2 2 0 0 1-1 0Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M15 6 9 3v15l6 3V6Z" stroke="currentColor" strokeWidth="2" />
      <path
        d="M21.5 4.7V17.8a1 1 0 0 1-.7 1L15 21V6l5.2-2.2a1 1 0 0 1 1.3.9Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l1.2 5.2L18 9l-4.8 1.8L12 16l-1.2-5.2L6 9l4.8-1.8L12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M19 13l.7 3L22 17l-2.3 1-.7 3-.7-3L16 17l2.3-1 .7-3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}