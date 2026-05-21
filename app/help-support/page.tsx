"use client";

import Link from "next/link";
import React from "react";
import PageShell from "@/components/site/PageShell";

/* =========================================================
   Small UI bits
========================================================= */

function ActionCard({
  title,
  desc,
  href,
  cta,
  featured = false,
  icon,
}: {
  title: string;
  desc: string;
  href: string;
  cta: string;
  featured?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "group rounded-[1.7rem] border p-6 transition",
        featured
          ? "border-[rgba(108,76,243,0.14)] bg-[linear-gradient(180deg,rgba(245,242,255,0.72),rgba(255,255,255,0.96))] shadow-sm"
          : "border-slate-200 bg-white/88 shadow-sm hover:border-slate-300 hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm">
          {icon}
        </span>

        <div className="min-w-0">
          <div className="text-[1.02rem] font-semibold tracking-[-0.02em] text-slate-950 sm:text-[1.08rem]">
            {title}
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
            {desc}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
            {cta}
            <span
              className="text-slate-400 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            >
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: React.ReactNode;
}) {
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

      <div className="mt-3 max-w-[48rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
        {answer}
      </div>
    </details>
  );
}

export default function HelpSupportPage() {
  return (
    <PageShell
      hideHero
      crumbs={[{ label: "Home", href: "/" }, { label: "Help & Support" }]}
    >
      {/* HERO */}
      <section className="pt-2 sm:pt-4 lg:pt-6">
        <div className="max-w-[76rem]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.14)] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
            Help & support
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
              Clear help, right when you need it
            </h1>
          </div>

          <p className="mt-10 max-w-[54rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
            Retrieve documents, check the most common questions, or get support if
            you need a hand. Everything is designed to stay clear from quote to policy.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/retrieve-policy" className="btn-primary btn-primary-lg !text-white">
              Retrieve policy
            </Link>

            <Link href="/contact" className="btn-ghost">
              Contact support
            </Link>

            <Link href="/more/faq" className="btn-ghost">
              View FAQs
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-700">
            {[
              "Clear next steps",
              "Instant document retrieval",
              "Support when needed",
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

      {/* START HERE */}
      <section className="mt-16">
        <div className="max-w-[56rem]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)]">
            Start here
          </div>

          <h2 className="mt-4 max-w-[15ch] text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:max-w-[14ch] lg:text-[4rem]">
            Choose the help route that fits
          </h2>

          <p className="mt-4 max-w-[44rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
            Most customers come here to retrieve documents, check a common question,
            or get in touch with support.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <ActionCard
            title="Retrieve documents"
            desc="Access your policy documents again without starting over."
            href="/retrieve-policy"
            cta="Retrieve policy"
            featured
            icon={<IconDoc />}
          />

          <ActionCard
            title="Read common questions"
            desc="Find clear answers on timings, lookup issues, retrieval and more."
            href="/more/faq"
            cta="Open FAQs"
            icon={<IconQuestion />}
          />

          <ActionCard
            title="Contact support"
            desc="Reach out if you need help with your quote, documents or next steps."
            href="/contact"
            cta="Contact support"
            icon={<IconMail />}
          />
        </div>
      </section>

      {/* SUPPORT DETAILS */}
      <section className="mt-16">
        <div className="rounded-[1.9rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(245,242,255,0.88),rgba(255,255,255,0.96))] p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Support details
              </div>

              <h2 className="mt-3 max-w-[16ch] text-[1.9rem] font-extrabold leading-[0.96] tracking-[-0.045em] text-slate-950 sm:text-[2.35rem]">
                Help with quotes, documents and retrieval
              </h2>

              <p className="mt-4 max-w-[38rem] text-[1rem] leading-8 text-slate-600">
                If something looks unclear, start with retrieval or the FAQs. If you
                still need a hand, our support team is easy to reach.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.35rem] border border-slate-200/80 bg-white/84 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Email
                      </div>
                      <div className="mt-2 text-[1.04rem] font-semibold tracking-[-0.02em] text-slate-950">
                        support@Coverza.com
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        We usually reply within one business day.
                      </p>
                    </div>

                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-900 shadow-sm">
                      <IconMail />
                    </span>
                  </div>
                </div>

                <div className="rounded-[1.35rem] border border-slate-200/80 bg-white/84 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Opening hours
                      </div>
                      <div className="mt-2 text-[1.04rem] font-semibold tracking-[-0.02em] text-slate-950">
                        Mon–Sat, 9am–7pm
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        Closed Sundays & bank holidays.
                      </p>
                    </div>

                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-900 shadow-sm">
                      <IconClock />
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/contact" className="btn-ghost">
                  Contact support
                </Link>

                <Link href="/retrieve-policy" className="btn-primary !text-white">
                  Retrieve policy
                </Link>

                <Link href="/more" className="btn-ghost">
                  Browse resources
                </Link>
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/84 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Common support needs
              </div>

              <div className="mt-4 grid gap-3">
                {[
                  "Retrieving policy documents later",
                  "Checking quote or cover timings",
                  "Vehicle lookup not found",
                  "Understanding eligibility and next steps",
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

              <div className="mt-5 text-[12px] leading-6 text-slate-500">
                Please do not send card details by email.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-16">
        <div className="max-w-[54rem]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)]">
            Quick answers
          </div>

          <h2 className="mt-4 max-w-[15ch] text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:max-w-[14ch] lg:text-[4rem]">
            Common questions, kept clear
          </h2>

          <p className="mt-4 max-w-[42rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
            Start with the most common support questions. For everything else,
            you can open the full FAQ or contact the team.
          </p>
        </div>

        <div className="mt-8 rounded-[1.8rem] border border-slate-200/80 bg-white/88 px-6 py-2 shadow-sm sm:px-8">
          <FaqItem
            question="How quickly can I get covered?"
            answer="Most customers complete the quote flow in a couple of minutes. After payment, your documents are available instantly and sent by email."
          />

          <FaqItem
            question="What if my vehicle lookup doesn’t find my reg?"
            answer="You can enter make and model details manually and continue. A lookup issue does not automatically mean you are not eligible."
          />

          <FaqItem
            question="Can I choose exact start and end times?"
            answer="Yes. You choose exact start and end times during the quote journey so your cover can fit around your plans."
          />

          <FaqItem
            question="How do I retrieve my policy documents later?"
            answer={
              <>
                Use the{" "}
                <Link href="/retrieve-policy" className="link font-medium">
                  Retrieve policy
                </Link>{" "}
                page and enter your policy reference to access your documents again.
              </>
            }
          />
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
            Refresh this page
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mt-16">
        <div className="rounded-[2rem] border border-[rgba(108,76,243,0.10)] bg-[linear-gradient(180deg,rgba(245,242,255,0.72),rgba(255,255,255,0.94))] px-6 py-10 shadow-sm sm:px-8 sm:py-12 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="heading-unbalanced text-center text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:text-[3.8rem]">
              Retrieve documents or contact support
            </h2>

            <div className="mx-auto mt-5 max-w-[38rem]">
              <p className="text-center text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
                Start with retrieval if you already bought cover. If something still
                looks wrong, contact support and we’ll guide you.
              </p>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/retrieve-policy" className="btn-primary !text-white">
                Retrieve policy
              </Link>

              <Link href="/contact" className="btn-ghost">
                Contact support
              </Link>
            </div>

            <div className="mt-5 text-[12px] leading-6 text-slate-500">
              Clear next steps, document access, and support when needed.
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

/* =========================================================
   Inline icons
========================================================= */

function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 7.5A2.5 2.5 0 0 1 7 5h10a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 17 19H7a2.5 2.5 0 0 1-2.5-2.5v-9Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M6.8 8.2 12 12l5.2-3.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

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

function IconQuestion() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M9.75 9.25a2.36 2.36 0 1 1 4.08 1.6c-.64.65-1.33 1.07-1.83 1.65-.3.34-.5.72-.5 1.25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M12 17h0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}