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
    title: "Short-term impound cover for a few hours",
    intro:
      "Useful when you only need temporary impound insurance for a short collection window after arranging vehicle release.",
    bullets: [
      "Choose an exact start time",
      "Useful for short release windows",
      "Documents issued instantly after purchase",
    ],
    useCases: [
      {
        title: "Same-day vehicle collection",
        desc: "A clear option when you need cover to collect a vehicle from an impound or recovery yard within a short time window.",
      },
      {
        title: "Short release appointments",
        desc: "Helpful when your collection is booked for a specific time and you only need short-term cover around that appointment.",
      },
      {
        title: "Last-minute impound release",
        desc: "Useful when you need to arrange insurance quickly in order to move forward with collecting the vehicle.",
      },
      {
        title: "Single collection journeys",
        desc: "A practical fit when the main need is to release and drive the vehicle away rather than arrange longer cover immediately.",
      },
    ],
    faqs: [
      {
        q: "Can I get impound insurance for just a few hours?",
        a: "Yes. Hourly impound cover can be useful when you only need insurance around a short collection window, subject to eligibility and insurer acceptance.",
      },
      {
        q: "Can I choose exactly when my impound cover starts?",
        a: "Yes. You can choose an exact start time during the quote journey so the policy fits around your collection plans.",
      },
      {
        q: "Is temporary impound insurance useful for releasing a vehicle the same day?",
        a: "Yes. It can be a practical option when you need short-term cover to collect a vehicle from impound as soon as release arrangements are in place.",
      },
      {
        q: "Will I get my documents straight away?",
        a: "Yes. Once cover is purchased, your policy documents are issued instantly and can also be retrieved later.",
      },
      {
        q: "What if vehicle lookup does not find my vehicle?",
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
    title: "One-day impound insurance cover",
    intro:
      "Designed for situations where you need a full day of impound cover to manage release, collection and short-term onward arrangements.",
    bullets: [
      "Cover for a full day",
      "Useful for release and collection plans",
      "Documents issued instantly after purchase",
    ],
    useCases: [
      {
        title: "Vehicle release days",
        desc: "A practical option when you need enough time to complete the release process and collect the vehicle in the same day.",
      },
      {
        title: "Coordinating paperwork and collection",
        desc: "Helpful when you need temporary cover while arranging the steps needed for release and pickup.",
      },
      {
        title: "Short onward journeys",
        desc: "Useful when you need impound insurance that covers the collection day and immediate next steps.",
      },
      {
        title: "Planned release appointments",
        desc: "A clear fit when your impound collection is booked for a set date and you want the cover arranged around it.",
      },
    ],
    faqs: [
      {
        q: "Is daily impound insurance suitable for a release day?",
        a: "Yes. Daily impound cover can be a useful fit when you need insurance across the collection day rather than only for a shorter time window.",
      },
      {
        q: "Can I arrange impound cover for later today?",
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
    title: "Short-term weekly impound cover",
    intro:
      "A clearer option when you need temporary cover across several days after release, without moving into a longer-term arrangement straight away.",
    bullets: [
      "Suitable for several days of cover",
      "Useful after release",
      "Documents issued instantly after purchase",
    ],
    useCases: [
      {
        title: "After-release arrangements",
        desc: "Useful when you want temporary cover for a few days after collecting a vehicle from impound.",
      },
      {
        title: "Sorting next steps",
        desc: "Helpful when you need cover while arranging storage, repairs, sale, or longer-term insurance.",
      },
      {
        title: "Short-term transition cover",
        desc: "A more flexible option when a week of cover makes more sense than arranging daily policies.",
      },
      {
        title: "Between immediate release and longer plans",
        desc: "Practical when you need breathing room after collection without committing straight away to something longer-term.",
      },
    ],
    faqs: [
      {
        q: "Is weekly impound cover available?",
        a: "Yes. Weekly impound cover can be useful when you need temporary insurance for several consecutive days after release.",
      },
      {
        q: "Can I still choose when the cover begins?",
        a: "Yes. Start times are chosen during the quote journey so your cover can fit around your release and collection plans.",
      },
      {
        q: "How quickly do I receive documents?",
        a: "Once purchased, documents are issued instantly and can be accessed again later if needed.",
      },
      {
        q: "What if I cannot find my vehicle using the registration?",
        a: "If the lookup does not return the vehicle, you can continue by entering the details manually.",
      },
    ],
  },

  monthly: {
    label: "Monthly",
    title: "Longer temporary impound cover",
    intro:
      "Ideal when you need impound-related cover for a longer temporary period while keeping the journey clear, flexible and easy to manage.",
    bullets: [
      "Useful for longer temporary needs",
      "Clear short-term alternative",
      "Documents issued instantly after purchase",
    ],
    useCases: [
      {
        title: "Longer post-release arrangements",
        desc: "Helpful when you need temporary cover for a longer defined period after collecting a vehicle from impound.",
      },
      {
        title: "Time to arrange next insurance steps",
        desc: "A practical option when you want cover in place while deciding on the longer-term future of the vehicle.",
      },
      {
        title: "Temporary access after release",
        desc: "Useful when the vehicle has been released but still only needs short-term insurance for a defined period.",
      },
      {
        title: "Longer short-term planning",
        desc: "A cleaner option when your needs go beyond a few days but still are not permanent.",
      },
    ],
    faqs: [
      {
        q: "Can I get impound insurance for a longer period?",
        a: "Yes. Monthly impound cover is designed for longer temporary needs while keeping the quote journey clear and flexible.",
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

export default function ImpoundPage() {
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
      crumbs={[{ label: "Home", href: "/" }, { label: "Impound" }]}
    >
      {/* HERO */}
      <section className="pt-2 sm:pt-4 lg:pt-6">
        <div className="max-w-[76rem]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.14)] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
            Impound insurance
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
              Impound insurance, on your timing
            </h1>
          </div>

          <p className="mt-10 max-w-[52rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
            Choose when cover should start, select the duration you need, and move
            through a clearer quote journey built for vehicle release and short-term
            impound collection needs.
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
              Find the impound cover that fits
            </h2>

            <p className="mt-5 max-w-[36rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
              Hourly, daily, weekly or monthly — choose the length that makes
              sense for your release and collection plans, then get a quote in minutes.
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
            When impound cover makes sense
          </div>

          <h2 className="mt-4 max-w-[16ch] text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:max-w-[15ch] lg:text-[4rem]">
            Built for real vehicle release needs
          </h2>

          <p className="mt-4 max-w-[44rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
            Impound insurance is usually arranged for a specific release or collection
            reason. Here are some of the common situations it can fit.
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
              Start your impound insurance quote
            </h2>

            <div className="mx-auto mt-5 max-w-[38rem]">
              <p className="text-center text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
                Move into the quote journey to choose your timing, confirm your
                vehicle details, and review the cover that fits your release plans.
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
            Impound cover questions
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
                If you have already bought impound cover, you can retrieve your policy
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
                support@Coverza.com
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
                  href="mailto:support@Coverza.com"
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