// app/more/faq/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/site/PageShell";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Clock3,
  FileText,
  RefreshCw,
  Search,
  CarFront,
} from "lucide-react";

/* =========================================================
   Types
========================================================= */

type FAQItem = {
  q: string;
  a: React.ReactNode;
  keywords?: string[];
  featured?: boolean;
};

type FAQSection = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  items: FAQItem[];
};

/* =========================================================
   Data
========================================================= */

import { faqs } from "@/content/documents/services";
const SECTIONS: readonly FAQSection[] = [
  {
    id: "scope",
    title: "Services & scope",
    description: "What is included and how to confirm the right document.",
    icon: <FileText className="h-5 w-5" />,
    items: faqs.slice(0, 2).map((x) => ({ ...x, featured: true })),
  },
  {
    id: "compatibility",
    title: "Vehicle & compatibility",
    description: "Where guidance applies and what you need to check.",
    icon: <CarFront className="h-5 w-5" />,
    items: faqs.slice(3, 5),
  },
  {
    id: "delivery",
    title: "Delivery & access",
    description: "Electronic delivery methods, timing and help opening files.",
    icon: <Clock3 className="h-5 w-5" />,
    items: [faqs[2], faqs[5], faqs[7]],
  },
  {
    id: "support",
    title: "Revisions & support",
    description: "Request a correction or clarify an agreed update.",
    icon: <RefreshCw className="h-5 w-5" />,
    items: [faqs[6]],
  },
];

function SectionNavChip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!active}
      className={[
        "inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
        active
          ? "border-[rgba(108,76,243,0.18)] bg-[rgba(108,76,243,0.08)] text-slate-950"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function FAQCard({
  q,
  a,
  open,
  onToggle,
  featured,
}: {
  q: string;
  a: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  featured?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[1.35rem] border bg-white/88 p-4 shadow-sm transition sm:p-5",
        open
          ? "border-[rgba(108,76,243,0.18)] bg-[rgba(108,76,243,0.04)]"
          : "border-slate-200/80 hover:border-slate-300 hover:bg-white",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {featured ? (
              <span className="inline-flex items-center rounded-full border border-[rgba(108,76,243,0.16)] bg-[rgba(108,76,243,0.08)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(108,76,243)]">
                Key question
              </span>
            ) : null}
          </div>

          <div className="mt-2 text-[1rem] font-semibold tracking-[-0.02em] text-slate-950 sm:text-[1.05rem]">
            {q}
          </div>
        </div>

        <span
          className={[
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition",
            open ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden="true"
        >
          <ChevronDown size={18} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="pt-4 text-sm leading-7 text-slate-600 sm:text-[0.97rem]">
              {a}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   Page
========================================================= */

export default function FaqPage() {
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string>("all");
  const [openMap, setOpenMap] = useState<Record<string, number | null>>({});

  const totalQuestions = useMemo(
    () => SECTIONS.reduce((sum, section) => sum + section.items.length, 0),
    [],
  );

  const featuredItems = useMemo(() => {
    return SECTIONS.flatMap((section) =>
      section.items
        .filter((item) => item.featured)
        .map((item) => ({
          sectionId: section.id,
          sectionTitle: section.title,
          q: item.q,
        })),
    ).slice(0, 8);
  }, []);

  const filteredSections = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const base =
      activeSection === "all"
        ? SECTIONS
        : SECTIONS.filter((section) => section.id === activeSection);

    if (!needle) return base;

    return base
      .map((section) => {
        const items = section.items.filter((item) => {
          const q = item.q.toLowerCase();
          const k = (item.keywords || []).join(" ").toLowerCase();
          const answer = typeof item.a === "string" ? item.a.toLowerCase() : "";
          return (
            q.includes(needle) || k.includes(needle) || answer.includes(needle)
          );
        });
        return { ...section, items };
      })
      .filter((section) => section.items.length > 0);
  }, [query, activeSection]);

  const totalResults = useMemo(
    () =>
      filteredSections.reduce((sum, section) => sum + section.items.length, 0),
    [filteredSections],
  );

  return (
    <PageShell
      hideHero
      crumbs={[
        { label: "Home", href: "/" },
        { label: "More", href: "/more" },
        { label: "FAQs" },
      ]}
    >
      {/* HERO */}
      <section className="pt-2 sm:pt-4 lg:pt-6">
        <div className="max-w-[76rem]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.14)] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
            Frequently asked questions
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

            <h1 className="heading-unbalanced relative max-w-[13ch] text-[3.25rem] font-extrabold leading-[0.9] tracking-[-0.07em] text-slate-950 sm:max-w-[12ch] sm:text-[4.55rem] lg:max-w-[11.5ch] lg:text-[5.85rem]">
              Clear answers, all in one place
            </h1>
          </div>

          <p className="mt-10 max-w-[54rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
            Search the questions that matter: what a service includes, how
            compatibility is checked, electronic delivery and help with
            revisions.
          </p>

          <div className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,560px)_auto] lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400">
                  <Search size={18} />
                </span>

                <input
                  className="input h-14 w-full !pl-14 pr-4"
                  placeholder="Search FAQs (e.g. documents, compatibility, delivery)…"
                  aria-label="Search frequently asked questions"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="mt-2 text-[12px] text-slate-500">
                {query.trim()
                  ? `${totalResults} ${totalResults === 1 ? "result" : "results"}`
                  : `${totalQuestions} questions`}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/retrieve-policy" className="btn-ghost">
                Existing documents
              </Link>
              <Link href="/help-support" className="btn-ghost">
                Help & Support
              </Link>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <SectionNavChip
              active={activeSection === "all"}
              onClick={() => setActiveSection("all")}
            >
              All
            </SectionNavChip>

            {SECTIONS.map((section) => (
              <SectionNavChip
                key={section.id}
                active={activeSection === section.id}
                onClick={() => setActiveSection(section.id)}
              >
                {section.title}
              </SectionNavChip>
            ))}
          </div>

          {!query.trim() ? (
            <div className="mt-8 rounded-[1.7rem] border border-slate-200/80 bg-white/86 p-5 shadow-sm sm:p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Start here
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {featuredItems.map((item) => (
                  <button
                    key={`${item.sectionId}-${item.q}`}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.sectionId);
                    }}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    {item.q}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-12 h-px w-full bg-[linear-gradient(90deg,rgba(226,232,240,0),rgba(226,232,240,0.95),rgba(226,232,240,0))]" />
        </div>
      </section>

      {/* CONTENT */}
      <section className="mt-16 space-y-14">
        {filteredSections.length > 0 ? (
          filteredSections.map((section, idx) => {
            const openIndex = openMap[section.id] ?? null;

            return (
              <motion.section
                key={section.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: idx * 0.03 }}
              >
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 shadow-sm">
                    {section.icon}
                  </span>

                  <div className="min-w-0">
                    <div className="text-base font-extrabold tracking-tight text-slate-950 sm:text-[1.08rem]">
                      {section.title}
                    </div>
                    <p className="mt-1 max-w-[46rem] text-sm leading-7 text-slate-600">
                      {section.description}
                    </p>
                    <div className="mt-2 text-[12px] text-slate-500">
                      {section.items.length} questions
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {section.items.map((item, i) => (
                    <FAQCard
                      key={`${section.id}-${i}`}
                      q={item.q}
                      a={item.a}
                      featured={item.featured}
                      open={openIndex === i}
                      onToggle={() =>
                        setOpenMap((prev) => ({
                          ...prev,
                          [section.id]: prev[section.id] === i ? null : i,
                        }))
                      }
                    />
                  ))}
                </div>
              </motion.section>
            );
          })
        ) : (
          <div className="rounded-[1.9rem] border border-slate-200/80 bg-white/88 p-6 shadow-sm sm:p-8">
            <div className="text-base font-extrabold tracking-tight text-slate-950">
              No results found
            </div>
            <p className="mt-2 max-w-[40rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
              Try a keyword such as documents, compatibility, delivery,
              collection or revisions.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "documents",
                "delivery",
                "cancel",
                "impound",
                "MID",
                "payment",
              ].map((term) => (
                <button
                  key={term}
                  type="button"
                  className="btn-ghost"
                  onClick={() => setQuery(term)}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* FINAL CTA */}
      <section className="mt-16">
        <div className="rounded-[2rem] border border-[rgba(108,76,243,0.10)] bg-[linear-gradient(180deg,rgba(245,242,255,0.72),rgba(255,255,255,0.94))] px-6 py-10 shadow-sm sm:px-8 sm:py-12 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="heading-unbalanced text-center text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:text-[3.8rem]">
              Still need help?
            </h2>

            <div className="mx-auto mt-5 max-w-[38rem]">
              <p className="text-center text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
                Keep your order reference to hand. Use existing document
                retrieval for previous purchases or contact support with a
                question.
              </p>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/help-support" className="btn-ghost">
                Help & Support
              </Link>

              <Link href="/retrieve-policy" className="btn-ghost">
                Existing documents
              </Link>

              <Link href="/get-quote" className="btn-primary !text-white">
                Enter vehicle details
              </Link>
            </div>

            <div className="mt-5 text-[12px] leading-6 text-slate-500">
              Clear answers, retrieval, and support when needed.
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
