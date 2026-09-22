"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/site/PageShell";

import { documentOptions, type DocumentTab } from "@/content/documents/options";
type Term = DocumentTab;
const TERM_CONTENT = documentOptions("learner");

function DurationButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition",
        active
          ? "border border-[rgba(108,76,243,0.18)] bg-[rgba(108,76,243,0.08)] text-slate-950 shadow-sm"
          : "border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-t border-slate-200/80 py-5">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
        <span className="pr-4 text-[1.02rem] font-semibold tracking-[-0.02em] text-slate-950 sm:text-[1.08rem]">
          {question}
        </span>

        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition group-open:rotate-45">
          +
        </span>
      </summary>

      <p className="mt-3 max-w-[48rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
        {answer}
      </p>
    </details>
  );
}

export default function LearnerPage() {
  const [term, setTerm] = useState<Term>("overview");

  const content = useMemo(() => TERM_CONTENT[term], [term]);

  return (
    <PageShell
      hideHero
      crumbs={[{ label: "Home", href: "/" }, { label: "Learner" }]}
    >
      {/* HERO */}
      <section className="pt-2 sm:pt-4 lg:pt-6">
        <div className="max-w-[76rem]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.14)] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
            Learner documents
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

            <h1 className="heading-unbalanced relative max-w-[14ch] text-[3.25rem] font-extrabold leading-[0.9] tracking-[-0.07em] text-slate-950 sm:max-w-[12.5ch] sm:text-[4.55rem] lg:max-w-[12.5ch] lg:text-[5.85rem]">
              Learner resources, a clearer starting point.
            </h1>
          </div>

          <p className="mt-10 max-w-[52rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
            Vehicle familiarisation documents and explanatory notes to
            complement practical instruction. Clearly organised information for
            a more considered starting point.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/get-quote"
              className="btn-primary btn-primary-lg !text-white"
            >
              Enter vehicle details
            </Link>

            <Link href="/retrieve-policy" className="btn-ghost">
              Existing documents
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-700">
            {[
              "Vehicle-specific information",
              "An agreed service scope",
              "Electronic delivery",
            ].map((item) => (
              <div key={item} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 text-[12px] leading-6 text-slate-500">
            Check the service scope, compatibility and limitations before
            ordering.
          </div>

          <div className="mt-12 h-px w-full bg-[linear-gradient(90deg,rgba(226,232,240,0),rgba(226,232,240,0.95),rgba(226,232,240,0))]" />
        </div>
      </section>

      {/* COVER LENGTH */}
      <section className="mt-16">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] xl:items-start">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)]">
              Explore your documents
            </div>

            <h2 className="mt-4 max-w-[12ch] text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:max-w-[11ch] lg:text-[4.3rem]">
              Find the information that fits your task
            </h2>

            <p className="mt-5 max-w-[36rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
              Explore the scope, technical guidance, delivery methods and
              support available. The applicable service description defines your
              exact deliverables.
            </p>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap gap-3">
              <DurationButton
                active={term === "overview"}
                label="Overview"
                onClick={() => setTerm("overview")}
              />
              <DurationButton
                active={term === "guidance"}
                label="Guidance"
                onClick={() => setTerm("guidance")}
              />
              <DurationButton
                active={term === "delivery"}
                label="Delivery"
                onClick={() => setTerm("delivery")}
              />
              <DurationButton
                active={term === "support"}
                label="Support"
                onClick={() => setTerm("support")}
              />
            </div>

            <div className="mt-6 rounded-[1.8rem] border border-slate-200/80 bg-white/88 p-6 shadow-sm sm:p-7">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {content.label}
              </div>

              <h3 className="mt-2 text-[1.8rem] font-extrabold leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-[2.1rem]">
                {content.title}
              </h3>

              <p className="mt-3 max-w-[42rem] text-[1rem] leading-8 text-slate-600">
                {content.intro}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {content.bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="rounded-[1.15rem] border border-slate-200/80 bg-slate-50/55 px-4 py-4 text-sm font-semibold leading-6 text-slate-950"
                  >
                    {bullet}
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Link href="/get-quote" className="btn-primary !text-white">
                  Enter vehicle details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="mt-16">
        <div className="max-w-[56rem]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)]">
            What your service can include
          </div>

          <h2 className="mt-4 max-w-[16ch] text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:max-w-[15ch] lg:text-[4rem]">
            A useful reference alongside your learning
          </h2>

          <p className="mt-4 max-w-[44rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
            Explanatory notes support understanding. They do not replace an
            instructor, official guidance or the arrangements needed for lawful
            practice.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {content.useCases.map((item) => (
            <div
              key={item.title}
              className="rounded-[1.7rem] border border-slate-200/80 bg-white/84 px-6 py-6 shadow-sm"
            >
              <div className="text-[1.15rem] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[1.28rem]">
                {item.title}
              </div>
              <p className="mt-2.5 max-w-[34rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* GET QUOTE CTA */}
      <section id="quote" className="mt-16 scroll-mt-24">
        <div className="rounded-[2rem] border border-[rgba(108,76,243,0.10)] bg-[linear-gradient(180deg,rgba(245,242,255,0.72),rgba(255,255,255,0.94))] px-6 py-10 shadow-sm sm:px-8 sm:py-12 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="heading-unbalanced text-center text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:text-[3.8rem]">
              Start with your vehicle details
            </h2>

            <div className="mx-auto mt-5 max-w-[38rem]">
              <p className="text-center text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
                Start with your vehicle details. The existing vehicle journey is
                available while the document-service ordering experience is
                being prepared.
              </p>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/get-quote" className="btn-primary !text-white">
                Enter vehicle details
              </Link>

              <Link href="/retrieve-policy" className="btn-ghost">
                Existing documents
              </Link>
            </div>

            <div className="mt-5 text-[12px] leading-6 text-slate-500">
              Clear requirements, an agreed scope and electronic delivery.
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-16">
        <div className="max-w-[54rem]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)]">
            Learner document questions
          </div>

          <h2 className="mt-4 max-w-[15ch] text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:max-w-[14ch] lg:text-[4rem]">
            Clear help, before and after purchase
          </h2>

          <p className="mt-4 max-w-[42rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
            From compatibility questions to document access and revisions, find
            the information you need before taking the next step.
          </p>
        </div>

        <div className="mt-8 rounded-[1.8rem] border border-slate-200/80 bg-white/88 px-6 py-2 shadow-sm sm:px-8">
          {content.faqs.map((item) => (
            <FaqItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/more/faq"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
          >
            View full FAQs
          </Link>

          <Link
            href="/help-support"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Help centre
          </Link>
        </div>
      </section>

      {/* SUPPORT / RETRIEVAL */}
      <section className="mt-12">
        <div className="rounded-[1.9rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(245,242,255,0.88),rgba(255,255,255,0.96))] p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Already have an order?
              </div>

              <h3 className="mt-3 max-w-[18ch] text-[1.9rem] font-extrabold leading-[0.96] tracking-[-0.045em] text-slate-950 sm:text-[2.35rem]">
                Retrieve documents or get support anytime
              </h3>

              <p className="mt-4 max-w-[38rem] text-[1rem] leading-8 text-slate-600">
                Keep your order reference, document version and delivery message
                together. Existing customers can use document retrieval, or
                contact support about an access issue or agreed revision.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/retrieve-policy"
                  className="btn-primary !text-white"
                >
                  Existing documents
                </Link>

                <Link href="/get-quote" className="btn-ghost">
                  Enter vehicle details
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

              <div className="mt-2 text-[1.08rem] font-semibold tracking-[-0.02em] text-slate-950">
                support@coverza.uk
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Reach out for help with document scope, delivery or an agreed
                revision.
              </p>

              <div className="mt-5 rounded-[1.15rem] border border-slate-200/80 bg-slate-50/60 px-4 py-4">
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

              <div className="mt-5">
                <a
                  href="mailto:support@coverza.uk"
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Email support
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPLIANCE */}
      <div className="mt-8 flex flex-col gap-2 text-[12px] text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
        {[
          "Service scope and compatibility apply",
          "Confirm what is included before ordering",
          "Read the document and its limitations carefully",
        ].map((item) => (
          <div key={item} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
