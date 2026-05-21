"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/site/PageShell";

type Term = "hourly" | "daily" | "weekly" | "monthly";

const TERM_CONTENT: Record<
  Term,
  {
    label: string;
    title: string;
    intro: string;
    bullets: string[];
    useCases: { title: string; desc: string }[];
    faqs: { q: string; a: string }[];
  }
> = {
  hourly: {
    label: "Hourly",
    title: "Short-term learner cover for a few hours",
    intro:
      "Useful when you only need learner driver insurance for a short practice session in a familiar car.",
    bullets: [
      "Choose an exact start time",
      "Useful for short practice sessions",
      "Documents issued instantly after purchase",
    ],
    useCases: [
      {
        title: "Quick practice sessions",
        desc: "A clear option when you only need learner cover for a short period of supervised driving.",
      },
      {
        title: "Practising in a family car",
        desc: "Helpful when you want extra time in a familiar vehicle outside of formal lessons.",
      },
      {
        title: "Fitting practice around your day",
        desc: "Useful when you only need learner insurance for a specific time window.",
      },
      {
        title: "Last-minute learner cover",
        desc: "Helpful when you want to arrange practice cover starting soon without a long commitment.",
      },
    ],
    faqs: [
      {
        q: "Can I get learner driver insurance for just a few hours?",
        a: "Yes. Hourly learner cover can be a useful fit when you only need insurance for a short supervised practice session.",
      },
      {
        q: "Can I choose exactly when my learner cover starts?",
        a: "Yes. You can choose an exact start time during the quote journey so the cover fits around your plans.",
      },
      {
        q: "Is learner insurance useful for practising in a parent’s or family car?",
        a: "Yes. It can be a practical option when you want to practise in a familiar car for a short period, subject to eligibility and insurer acceptance.",
      },
      {
        q: "Will I get my documents straight away?",
        a: "Yes. Once cover is purchased, your policy documents are issued instantly and can also be retrieved later.",
      },
      {
        q: "What if vehicle lookup does not find the car?",
        a: "You can continue by entering the vehicle details manually if registration lookup does not return a result.",
      },
      {
        q: "Can I still retrieve my policy documents later?",
        a: "Yes. If you have already purchased cover, you can retrieve your documents again later without needing to start over.",
      },
    ],
  },

  daily: {
    label: "Daily",
    title: "One-day learner driver cover",
    intro:
      "Designed for longer practice across a day, whether you are building confidence, preparing for a test, or fitting practice around your schedule.",
    bullets: [
      "Cover for a full day",
      "Useful for one-off practice plans",
      "Documents issued instantly after purchase",
    ],
    useCases: [
      {
        title: "Test preparation",
        desc: "A practical option when you want extra supervised driving before an upcoming test.",
      },
      {
        title: "Weekend practice",
        desc: "Useful when you want a full day of learner cover in a familiar car.",
      },
      {
        title: "Longer confidence-building sessions",
        desc: "Helpful when a few hours is not enough and you want more time on the road.",
      },
      {
        title: "Planned practice days",
        desc: "A clear fit for a specific day of learner driving without a longer commitment.",
      },
    ],
    faqs: [
      {
        q: "Is daily learner insurance suitable for one-day practice?",
        a: "Yes. Daily learner cover is designed for situations where you want supervised driving practice across a single day.",
      },
      {
        q: "Can I arrange learner cover for later today?",
        a: "Yes. You can choose your start time during the quote journey, subject to eligibility and insurer acceptance.",
      },
      {
        q: "Do documents arrive straight after purchase?",
        a: "Yes. Your documents are issued instantly after purchase and can also be retrieved later if needed.",
      },
      {
        q: "Can I still continue if registration lookup fails?",
        a: "Yes. You can enter the vehicle details manually and continue your quote.",
      },
    ],
  },

  weekly: {
    label: "Weekly",
    title: "Short-term weekly learner cover",
    intro:
      "A clear option when you want learner driver insurance across several days of practice without moving into a longer arrangement.",
    bullets: [
      "Suitable for several days of practice",
      "Useful for short learning periods",
      "Documents issued instantly after purchase",
    ],
    useCases: [
      {
        title: "Practising across a full week",
        desc: "Useful when you want consistent supervised driving time over several days.",
      },
      {
        title: "Building confidence before a test",
        desc: "Helpful when you want regular practice in a familiar car across one week.",
      },
      {
        title: "Learning around your schedule",
        desc: "A more flexible option when a week of learner cover makes more sense than daily cover.",
      },
      {
        title: "Short-term structured practice",
        desc: "Practical when you want more continuity without committing to something longer-term.",
      },
    ],
    faqs: [
      {
        q: "Is weekly learner cover available?",
        a: "Yes. Weekly learner cover can be a useful fit when you want temporary insurance over several consecutive days of supervised practice.",
      },
      {
        q: "Can I still choose when the cover begins?",
        a: "Yes. Start times are chosen during the quote journey so your learner cover can fit around your plans.",
      },
      {
        q: "How quickly do I receive documents?",
        a: "Once purchased, documents are issued instantly and can be accessed again later if needed.",
      },
      {
        q: "What if I cannot find the car using the registration?",
        a: "If the lookup does not return the vehicle, you can continue by entering the details manually.",
      },
    ],
  },

  monthly: {
    label: "Monthly",
    title: "Longer temporary learner cover",
    intro:
      "Ideal when you want learner insurance for a longer temporary period while keeping the journey clear, flexible and easy to manage.",
    bullets: [
      "Useful for longer temporary needs",
      "Clear short-term alternative",
      "Documents issued instantly after purchase",
    ],
    useCases: [
      {
        title: "Longer learning periods",
        desc: "Helpful when you want learner cover across several weeks of practice in a familiar car.",
      },
      {
        title: "Steady confidence-building",
        desc: "A practical option when you want more regular driving time over a longer short-term period.",
      },
      {
        title: "Consistent supervised driving",
        desc: "Useful when you need cover for repeated learner practice over a defined period.",
      },
      {
        title: "Longer short-term planning",
        desc: "A cleaner option when your needs go beyond a few days but still are not permanent.",
      },
    ],
    faqs: [
      {
        q: "Can I get learner insurance for a longer period?",
        a: "Yes. Monthly learner cover is designed for longer temporary needs while keeping the quote journey clear and flexible.",
      },
      {
        q: "Can I choose my cover start date and time?",
        a: "Yes. You choose when cover starts during the quote flow.",
      },
      {
        q: "Are policy documents issued immediately?",
        a: "Yes. Once you purchase cover, documents are issued instantly and can be retrieved later.",
      },
      {
        q: "Can I continue if vehicle lookup is unavailable?",
        a: "Yes. Manual entry is available if registration lookup does not return the vehicle.",
      },
    ],
  },
};

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
  const [term, setTerm] = useState<Term>("hourly");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextTerm = params.get("term");

    if (
      nextTerm === "hourly" ||
      nextTerm === "daily" ||
      nextTerm === "weekly" ||
      nextTerm === "monthly"
    ) {
      setTerm(nextTerm);
    }
  }, []);

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
            Learner driver insurance
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
              Learner insurance, on your timing
            </h1>
          </div>

          <p className="mt-10 max-w-[52rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
            Choose when cover should start, select the duration you need, and move
            through a clearer quote journey built for supervised learner driving.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/get-quote" className="btn-primary btn-primary-lg !text-white">
              Start your quote
            </Link>

            <Link href="/retrieve-policy" className="btn-ghost">
              Retrieve policy
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-700">
            {[
              "Choose exact start times",
              "From 1 hour to 12 months",
              "Documents issued instantly",
            ].map((item) => (
              <div key={item} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 text-[12px] leading-6 text-slate-500">
            Eligibility, underwriting and insurer acceptance apply.
          </div>

          <div className="mt-12 h-px w-full bg-[linear-gradient(90deg,rgba(226,232,240,0),rgba(226,232,240,0.95),rgba(226,232,240,0))]" />
        </div>
      </section>

      {/* COVER LENGTH */}
      <section className="mt-16">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] xl:items-start">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)]">
              Choose cover length
            </div>

            <h2 className="mt-4 max-w-[12ch] text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:max-w-[11ch] lg:text-[4.3rem]">
              Find the learner cover that fits
            </h2>

            <p className="mt-5 max-w-[36rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
              Hourly, daily, weekly or monthly — choose the length that makes
              sense for your practice plans, then get a quote in minutes.
            </p>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap gap-3">
              <DurationButton
                active={term === "hourly"}
                label="Hourly"
                onClick={() => setTerm("hourly")}
              />
              <DurationButton
                active={term === "daily"}
                label="Daily"
                onClick={() => setTerm("daily")}
              />
              <DurationButton
                active={term === "weekly"}
                label="Weekly"
                onClick={() => setTerm("weekly")}
              />
              <DurationButton
                active={term === "monthly"}
                label="Monthly"
                onClick={() => setTerm("monthly")}
              />
            </div>

            <div className="mt-6 rounded-[1.8rem] border border-slate-200/80 bg-white/88 p-6 shadow-sm sm:p-7">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {content.label} cover
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
                  Get a quote
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
            When learner cover makes sense
          </div>

          <h2 className="mt-4 max-w-[16ch] text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:max-w-[15ch] lg:text-[4rem]">
            Built for real learner driving needs
          </h2>

          <p className="mt-4 max-w-[44rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
            Learner insurance is usually arranged for a specific practice reason.
            Here are some of the common situations it can fit.
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
              Start your learner insurance quote
            </h2>

            <div className="mx-auto mt-5 max-w-[38rem]">
              <p className="text-center text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
                Move into the quote journey to choose your timing, confirm your
                vehicle details, and review the cover that fits your plans.
              </p>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/get-quote" className="btn-primary !text-white">
                Get a quote
              </Link>

              <Link href="/retrieve-policy" className="btn-ghost">
                Retrieve policy
              </Link>
            </div>

            <div className="mt-5 text-[12px] leading-6 text-slate-500">
              Clear steps, secure checkout, and documents issued instantly after purchase.
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-16">
        <div className="max-w-[54rem]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)]">
            Learner cover questions
          </div>

          <h2 className="mt-4 max-w-[15ch] text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:max-w-[14ch] lg:text-[4rem]">
            Clear help, before and after purchase
          </h2>

          <p className="mt-4 max-w-[42rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
            Whether you are starting a quote or retrieving documents later,
            support should feel just as clear as the rest of the journey.
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
                Already purchased cover?
              </div>

              <h3 className="mt-3 max-w-[18ch] text-[1.9rem] font-extrabold leading-[0.96] tracking-[-0.045em] text-slate-950 sm:text-[2.35rem]">
                Retrieve documents or get support anytime
              </h3>

              <p className="mt-4 max-w-[38rem] text-[1rem] leading-8 text-slate-600">
                If you have already bought learner cover, you can retrieve your policy
                documents again without needing to start over. If you need help,
                our support team is also easy to reach.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/retrieve-policy" className="btn-primary !text-white">
                  Retrieve policy
                </Link>

                <Link href="/get-quote" className="btn-ghost">
                  Start your quote
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
                support@coverza.com
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Reach out if you need help with your quote, documents or retrieval.
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
                  href="mailto:support@coverza.com"
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
          "Eligibility and underwriting apply",
          "You’ll review details before payment",
          "Always read your policy documents carefully",
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