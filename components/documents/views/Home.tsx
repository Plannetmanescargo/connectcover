/* /app/page.tsx */
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, MotionConfig, useReducedMotion } from "framer-motion";

const easeOut = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (d = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOut, delay: d },
  }),
};

const complianceLine =
  "Exact deliverables, delivery and revisions depend on your agreed service.";
export default function HomePage() {
  const reduceMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen text-slate-900">
        <a
          href="/get-quote"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow-lg"
        >
          Enter vehicle details
        </a>

        <div className="bg-wash">
          {/* HERO */}
          <section className="relative overflow-hidden bg-white">
            {/* Subtle radial light — kept very soft so it feels clean, not purple-heavy */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-32 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(108,76,243,0.09)_0%,transparent_70%)]" />
              <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(74,96,245,0.06)_0%,transparent_70%)]" />
            </div>

            <div className="container-app relative z-10 px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:px-10 lg:pb-24 lg:pt-20">
              {/* ── MOBILE: full-width single column ── DESKTOP: 2-col ── */}
              <div className="flex flex-col gap-12 xl:flex-row xl:items-center xl:gap-16">
                {/* ════ LEFT — headline + CTA ════ */}
                <div className="flex-1 min-w-0">
                  {/* Eyebrow pill */}
                  <motion.div
                    initial={false}
                    animate="show"
                    variants={fadeUp}
                    custom={0.02}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.16)] bg-[rgba(108,76,243,0.05)] px-3.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.20em] text-[rgb(108,76,243)]"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                    Details that connect
                  </motion.div>

                  {/* Headline — tight, big, Apple-style */}
                  <motion.h1
                    initial={false}
                    animate="show"
                    variants={fadeUp}
                    custom={0.08}
                    className="mt-5 text-[2.85rem] font-extrabold leading-[0.92] tracking-[-0.055em] text-slate-950 sm:text-[3.6rem] lg:text-[4.4rem]"
                  >
                    Documents built
                    <br />
                    <span className="text-[rgb(108,76,243)]">around you.</span>
                    <br />
                    Clearly Coverza.
                  </motion.h1>

                  {/* Sub */}
                  <motion.p
                    initial={false}
                    animate="show"
                    variants={fadeUp}
                    custom={0.14}
                    className="mt-5 max-w-[30rem] text-[1rem] leading-[1.85] text-slate-500 sm:text-[1.05rem]"
                  >
                    From vehicle-specific documents to technical guides and
                    compatibility notes. The right information, clearly
                    organised and delivered digitally, with the scope agreed
                    from the start.
                  </motion.p>

                  {/* CTA buttons */}
                  <motion.div
                    initial={false}
                    animate="show"
                    variants={fadeUp}
                    custom={0.18}
                    className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
                  >
                    <motion.div
                      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.975 }}
                      className="w-full sm:w-auto"
                    >
                      <Link
                        className="btn-primary btn-primary-lg flex w-full items-center justify-center gap-2 text-white sm:w-auto"
                        href="/get-quote"
                      >
                        Enter vehicle details
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M3 7h8M7.5 3.5 11 7l-3.5 3.5"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Link>
                    </motion.div>

                    <motion.div
                      whileHover={reduceMotion ? undefined : { scale: 1.01 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                      className="w-full sm:w-auto"
                    >
                      <Link
                        className="btn-ghost flex w-full items-center justify-center sm:w-auto"
                        href="/retrieve-policy"
                      >
                        Existing documents
                      </Link>
                    </motion.div>
                  </motion.div>

                  {/* Trust row — 3 micro stats, single line on mobile */}
                  <motion.div
                    initial={false}
                    animate="show"
                    variants={fadeUp}
                    custom={0.22}
                    className="mt-10 grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-100 pt-6"
                  >
                    {[
                      { val: "Clear", label: "Scope" },
                      { val: "Digital", label: "Delivery" },
                      { val: "Helpful", label: "Support" },
                    ].map(({ val, label }) => (
                      <div
                        key={label}
                        className="flex flex-col gap-1 px-3 first:pl-0 last:pr-0 sm:flex-row sm:items-baseline sm:gap-1.5 sm:px-4"
                      >
                        <span className="text-[1.05rem] font-extrabold tracking-tight text-slate-950">
                          {val}
                        </span>
                        <span className="text-[12px] text-slate-400">
                          {label}
                        </span>
                      </div>
                    ))}
                  </motion.div>

                  {/* Compliance */}
                  <motion.div
                    initial={false}
                    animate="show"
                    variants={fadeUp}
                    custom={0.26}
                    className="mt-5 max-w-[34rem] space-y-1 text-[11.5px] leading-[1.7] text-slate-400"
                  >
                    <div>{complianceLine}</div>
                    <div>
                      Vehicle information, technical guidance and supporting
                      digital documents.
                    </div>
                  </motion.div>
                </div>

                {/* ════ RIGHT — premium visual block ════ */}
                <motion.div
                  initial={false}
                  animate="show"
                  variants={fadeUp}
                  custom={0.1}
                  className="w-full xl:w-[420px] xl:shrink-0"
                >
                  {/* Photo triptych — same images, new premium card treatment */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    {[
                      {
                        src: "/images/hero-car-4.png",
                        alt: "Driving in the city with Coverza",
                      },
                      {
                        src: "/images/hero-car-5.png",
                        alt: "Vehicle detail with Coverza",
                      },
                      {
                        src: "/images/hero-car-6.png",
                        alt: "Automotive documentation from Coverza",
                      },
                    ].map(({ src, alt }, i) => (
                      <div
                        key={src}
                        className={`overflow-hidden rounded-[1.25rem] border border-slate-100 bg-slate-50 shadow-sm ${
                          i === 1 ? "translate-y-3 sm:translate-y-5" : ""
                        }`}
                      >
                        <div className="relative aspect-[3/4] w-full">
                          <Image
                            src={src}
                            alt={alt}
                            fill
                            sizes="(min-width: 1280px) 130px, 33vw"
                            className="object-cover object-center"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cover card — floats below the photos */}
                  <motion.div
                    initial={false}
                    animate="show"
                    variants={fadeUp}
                    custom={0.2}
                    className="mt-4 rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-[0_8px_40px_rgba(15,23,42,0.07)]"
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Your vehicle, your documents
                        </p>
                        <p className="mt-0.5 text-[1.05rem] font-extrabold tracking-tight text-slate-950">
                          The detail, brought together
                        </p>
                      </div>
                      {/* Verified badge */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(108,76,243,0.08)]">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 20 20"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M10 2.5 12.09 7.26l5.16.75-3.73 3.63.88 5.13L10 14.27l-4.4 2.5.88-5.13L2.75 8.01l5.16-.75L10 2.5Z"
                            stroke="rgb(108,76,243)"
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Step pills */}
                    <div className="mt-4 flex flex-col gap-2">
                      {[
                        {
                          icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                          label: "Confirm your vehicle details",
                        },
                        {
                          icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                          label: "Understand the document scope",
                        },
                        {
                          icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 10.414V19a2 2 0 01-2 2z",
                          label: "Receive the agreed digital resources",
                        },
                      ].map(({ icon, label }, i) => (
                        <div
                          key={label}
                          className="flex items-center gap-3 rounded-[0.85rem] bg-slate-50/80 px-3.5 py-2.5"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200">
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="rgb(108,76,243)"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d={icon} />
                            </svg>
                          </span>
                          <span className="text-[12.5px] font-medium text-slate-700">
                            {label}
                          </span>
                          <span className="ml-auto text-[11px] font-semibold text-[rgb(108,76,243)]">
                            {i + 1}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* No-claims note */}
                    <div className="mt-4 flex items-center gap-2 rounded-[0.85rem] bg-[rgba(108,76,243,0.05)] px-3.5 py-2.5">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 12 12"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M2.5 6.2 4.8 8.5 9.5 3.8"
                          stroke="rgb(108,76,243)"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="text-[11.5px] font-medium text-[rgb(108,76,243)]">
                        Clear scope. Useful information. Agreed delivery.
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* WHY Coverza */}
          <section className="section relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(108,76,243,0.08),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(74,96,245,0.06),transparent_26%),linear-gradient(to_bottom,rgba(255,255,255,0.72),rgba(248,250,252,0.92))]" />

            <div className="container-app relative z-10">
              <div className="grid gap-12 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] xl:items-start">
                {/* Left */}
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.12)] bg-white/75 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(108,76,243)] backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                    Why Coverza
                  </div>

                  <h2 className="mt-5 max-w-[12ch] text-3xl font-extrabold leading-[0.97] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:text-[4rem]">
                    A clearer way to understand the detail
                  </h2>

                  <p className="mt-5 max-w-[35rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
                    Technical information should feel useful, not overwhelming.
                    Coverza brings vehicle-specific documents, guidance and
                    explanatory notes into a service with a clear purpose.
                  </p>
                </div>

                {/* Right */}
                <div className="xl:pt-1">
                  <div className="grid gap-0 border-t border-slate-200/80">
                    <div className="grid gap-4 py-6 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-8 lg:py-7">
                      <div className="flex items-center justify-between sm:block">
                        <div className="inline-flex items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            01
                          </span>
                          <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]/60 sm:hidden" />
                        </div>
                        <div className="mt-0 sm:mt-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Relevance
                        </div>
                      </div>

                      <div>
                        <div className="flex items-start gap-3">
                          <span className="mt-2 hidden h-2 w-2 shrink-0 rounded-full bg-[rgb(108,76,243)]/60 sm:block" />
                          <div>
                            <div className="text-[1.18rem] font-semibold leading-[1.08] tracking-[-0.03em] text-slate-950 sm:text-[1.34rem]">
                              Start with the vehicle and the task
                            </div>
                            <p className="mt-2.5 max-w-[37rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
                              Tell us the vehicle specification and the
                              information you need. The right starting point
                              makes the scope clearer.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 border-t border-slate-200/80 py-6 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-8 lg:py-7">
                      <div className="flex items-center justify-between sm:block">
                        <div className="inline-flex items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            02
                          </span>
                          <span className="h-1.5 w-1.5 rounded-full bg-[rgb(74,96,245)]/60 sm:hidden" />
                        </div>
                        <div className="mt-0 sm:mt-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Flexibility
                        </div>
                      </div>

                      <div>
                        <div className="flex items-start gap-3">
                          <span className="mt-2 hidden h-2 w-2 shrink-0 rounded-full bg-[rgb(74,96,245)]/60 sm:block" />
                          <div>
                            <div className="text-[1.18rem] font-semibold leading-[1.08] tracking-[-0.03em] text-slate-950 sm:text-[1.34rem]">
                              From a reference note to a technical guide
                            </div>
                            <p className="mt-2.5 max-w-[37rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
                              The deliverables depend on the service: coding
                              instructions, diagnostic guidance, compatibility
                              information or supporting documents.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 border-t border-slate-200/80 py-6 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-8 lg:py-7">
                      <div className="flex items-center justify-between sm:block">
                        <div className="inline-flex items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            03
                          </span>
                          <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]/45 sm:hidden" />
                        </div>
                        <div className="mt-0 sm:mt-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Clarity
                        </div>
                      </div>

                      <div>
                        <div className="flex items-start gap-3">
                          <span className="mt-2 hidden h-2 w-2 shrink-0 rounded-full bg-[rgb(108,76,243)]/45 sm:block" />
                          <div>
                            <div className="text-[1.18rem] font-semibold leading-[1.08] tracking-[-0.03em] text-slate-950 sm:text-[1.34rem]">
                              Know what your document includes
                            </div>
                            <p className="mt-2.5 max-w-[37rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
                              Agree the purpose, prerequisites, delivery format
                              and any included revisions before placing an
                              order.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 border-t border-b border-slate-200/80 py-6 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-8 lg:py-7">
                      <div className="flex items-center justify-between sm:block">
                        <div className="inline-flex items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            04
                          </span>
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400/60 sm:hidden" />
                        </div>
                        <div className="mt-0 sm:mt-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Documents
                        </div>
                      </div>

                      <div>
                        <div className="flex items-start gap-3">
                          <span className="mt-2 hidden h-2 w-2 shrink-0 rounded-full bg-slate-400/60 sm:block" />
                          <div>
                            <div className="text-[1.18rem] font-semibold leading-[1.08] tracking-[-0.03em] text-slate-950 sm:text-[1.34rem]">
                              Delivered digitally, for easy reference
                            </div>
                            <p className="mt-2.5 max-w-[37rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
                              Receive your documents through the agreed
                              electronic method. Keep the file, version and
                              order reference together for future support.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CHOOSE THE COVER THAT FITS */}
          <section className="section">
            <div className="container-app">
              <div className="mx-auto max-w-3xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.14)] bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(108,76,243)] backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                  Find your starting point
                </div>

                <h2 className="mt-6 text-4xl font-extrabold tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-[4rem]">
                  Different vehicles. The same attention to detail.
                </h2>

                <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  Explore documentation for cars and vans, learner resources and
                  supporting collection information. Each service begins with a
                  clearly defined requirement.
                </p>
              </div>

              <div className="mt-12 grid gap-5 lg:grid-cols-3">
                <CoverOptionCard
                  eyebrow="Learner resources"
                  title="Learner documents"
                  desc="Vehicle familiarisation notes and explanatory resources to support your understanding alongside practical instruction."
                  points={[
                    "Vehicle familiarisation",
                    "Clear explanatory notes",
                    "Delivery as agreed",
                  ]}
                  href="/learner"
                  cta="Explore learner resources"
                  icon={<IconId />}
                />

                <CoverOptionCard
                  eyebrow="Car documents"
                  title="Car documents"
                  desc="Vehicle-specific references, coding or configuration instructions and technical guidance for an agreed automotive task."
                  points={[
                    "Vehicle-specific information",
                    "An agreed service scope",
                    "Electronic delivery",
                  ]}
                  href="/car"
                  cta="Explore car documents"
                  icon={<IconCar />}
                  featured
                />

                <CoverOptionCard
                  eyebrow="Van documents"
                  title="Van documents"
                  desc="Technical references and supporting documents organised around your van, its equipment and the configuration that matters."
                  points={[
                    "Vehicle-specific scope",
                    "Practical technical references",
                    "Support with document access",
                  ]}
                  href="/van"
                  cta="Explore van documents"
                  icon={<IconBolt />}
                />
              </div>

              <div className="mt-10 flex justify-center">
                <Link href="/get-quote" className="btn-primary !text-white">
                  Enter vehicle details
                </Link>
              </div>
            </div>
          </section>

          {/* WHEN Coverza MAKES SENSE */}
          <section className="section relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(108,76,243,0.05),transparent_24%),linear-gradient(to_bottom,rgba(255,255,255,0.72),rgba(248,250,252,0.94))]" />

            <div className="container-app relative z-10">
              <div className="mx-auto max-w-3xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.12)] bg-white/75 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(108,76,243)] backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                  When Coverza makes sense
                </div>

                <h2 className="mt-6 text-4xl font-extrabold tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-[4rem]">
                  For the detail behind everyday decisions.
                </h2>

                <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  A configuration question, a technical reference or a
                  collection enquiry. Start with the task, then establish the
                  information that will help.
                </p>
              </div>

              <div className="mt-12 grid gap-5 md:grid-cols-2">
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="group rounded-[1.8rem] border border-slate-200/80 bg-white/78 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur transition-all duration-300 hover:border-[rgba(108,76,243,0.18)] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:p-7"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Configuration
                  </div>
                  <div className="mt-3 text-[1.45rem] font-semibold leading-[1.08] tracking-[-0.035em] text-slate-950">
                    Understanding your vehicle’s configuration
                  </div>
                  <p className="mt-3 max-w-[32rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
                    Bring the relevant specification, software references and
                    compatibility notes together before considering a change.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="group rounded-[1.8rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(245,242,255,0.92),rgba(255,255,255,0.82))] p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur transition-all duration-300 hover:border-[rgba(108,76,243,0.18)] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:p-7"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Learner
                  </div>
                  <div className="mt-3 text-[1.45rem] font-semibold leading-[1.08] tracking-[-0.035em] text-slate-950">
                    Getting familiar with a vehicle
                  </div>
                  <p className="mt-3 max-w-[32rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
                    Clear explanatory notes can complement practical
                    instruction. They do not replace official requirements or a
                    qualified instructor.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="group rounded-[1.8rem] border border-slate-200/80 bg-white/78 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur transition-all duration-300 hover:border-[rgba(108,76,243,0.18)] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:p-7"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Practical use
                  </div>
                  <div className="mt-3 text-[1.45rem] font-semibold leading-[1.08] tracking-[-0.035em] text-slate-950">
                    A technical reference for your van
                  </div>
                  <p className="mt-3 max-w-[32rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
                    Organise the vehicle-specific information and prerequisites
                    for an agreed task or enquiry.
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="group rounded-[1.8rem] border border-slate-200/80 bg-white/78 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur transition-all duration-300 hover:border-[rgba(108,76,243,0.18)] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:p-7"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Collection
                  </div>
                  <div className="mt-3 text-[1.45rem] font-semibold leading-[1.08] tracking-[-0.035em] text-slate-950">
                    Preparing supporting collection documents
                  </div>
                  <p className="mt-3 max-w-[32rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
                    Understand what supporting information you have. Always
                    confirm release requirements directly with the collection
                    operator.
                  </p>
                </motion.div>
              </div>
            </div>
          </section>

          {/* TESTIMONIALS */}
          <section className="section relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(108,76,243,0.05),transparent_24%),radial-gradient(circle_at_82%_20%,rgba(74,96,245,0.04),transparent_22%),linear-gradient(to_bottom,rgba(255,255,255,0.72),rgba(248,250,252,0.94))]" />

            <div className="container-app relative z-10">
              <div className="mx-auto max-w-3xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.12)] bg-white/75 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(108,76,243)] backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                  Considered from the start
                </div>

                <h2 className="mt-6 text-4xl font-extrabold tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-[4rem]">
                  Small details. A better document experience.
                </h2>

                <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  What matters before you order, when your documents arrive and
                  whenever you need another look.
                </p>
              </div>

              <div className="mt-12 grid gap-5 lg:grid-cols-3">
                <ServiceDetailCard
                  name="Before ordering"
                  location="01"
                  scenario="An agreed scope"
                  quote="Confirm the task, the vehicle details and the deliverables. Know the prerequisites, delivery format and included revisions before you order."
                />

                <ServiceDetailCard
                  name="On delivery"
                  location="02"
                  scenario="A useful reference"
                  quote="Receive the agreed digital documents. Keep the original delivery message, document version and order reference together."
                  featured
                />

                <ServiceDetailCard
                  name="After delivery"
                  location="03"
                  scenario="Support that makes sense"
                  quote="Need a correction or help opening a file? Share the reference and a clear description so support can understand the request."
                />
              </div>

              <div className="mt-10 flex flex-col items-center gap-3">
                <div className="text-[12px] text-slate-500">
                  Exact deliverables and included revisions are defined by your
                  order.
                </div>

                <Link href="/get-quote" className="btn-primary !text-white">
                  Enter vehicle details
                </Link>
              </div>
            </div>
          </section>

          {/* FINAL QUESTIONS / SUPPORT */}
          <section className="section relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(108,76,243,0.05),transparent_24%),radial-gradient(circle_at_88%_0%,rgba(74,96,245,0.04),transparent_24%)]" />

            <div className="container-app relative z-10">
              {/* TOP ROW */}
              <div className="grid gap-12 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:items-start">
                {/* Left */}
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.12)] bg-white/75 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(108,76,243)] backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                    Questions and support
                  </div>

                  <h2 className="mt-5 max-w-[15ch] text-3xl font-extrabold leading-[0.94] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:text-[4rem]">
                    Clear help, right when you need it
                  </h2>

                  <p className="mt-5 max-w-[36rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
                    The final part of the journey should feel just as clear as
                    the first. Find quick answers, retrieve your documents
                    later, or get support if you need a hand.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
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
                </div>

                {/* Right */}
                <div className="min-w-0">
                  <div className="border-t border-slate-200/80">
                    <FaqLineItem
                      question="When will my documents arrive?"
                      answer="Delivery timing depends on the agreed service. Check the timeframe and delivery method in your order; not every document is available instantly."
                    />
                    <FaqLineItem
                      question="What can a service include?"
                      answer="A service may include technical guides, vehicle-specific documents, coding instructions, compatibility notes or other agreed digital resources."
                    />
                    <FaqLineItem
                      question="How do I retrieve my documents later?"
                      answer="Keep your delivery message and order reference. Existing customers can use the document retrieval journey; contact support if you need help with access."
                    />
                    <FaqLineItem
                      question="What details do I need to start?"
                      answer="Your vehicle specification, the relevant equipment or software version, and the task you need documented. Flag any details you are unsure about."
                    />
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW - SINGLE CENTERED SUPPORT / RETRIEVAL CARD */}
              <div className="mx-auto mt-12 max-w-[980px]">
                <div className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(245,242,255,0.88),rgba(255,255,255,0.97))] p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-8 lg:p-10">
                  <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-10">
                    {/* Left */}
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Already have an order?
                      </div>

                      <h3 className="mt-3 text-[2rem] font-extrabold leading-[0.96] tracking-[-0.05em] text-slate-950 sm:text-[2.35rem] ">
                        Retrieve documents or get support anytime
                      </h3>

                      <p className="mt-4 max-w-[40rem] text-[1rem] leading-8 text-slate-600">
                        Keep your order reference and delivery message to hand.
                        Existing customers can use document retrieval, or
                        contact support for help with a file or an agreed
                        revision.
                      </p>

                      <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[1.15rem] border border-slate-200/80 bg-white/85 px-4 py-4">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Retrieval
                          </div>
                          <div className="mt-2 text-sm font-semibold text-slate-950">
                            Access later
                          </div>
                        </div>

                        <div className="rounded-[1.15rem] border border-slate-200/80 bg-white/85 px-4 py-4">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Documents
                          </div>
                          <div className="mt-2 text-sm font-semibold text-slate-950">
                            Digital delivery
                          </div>
                        </div>

                        <div className="rounded-[1.15rem] border border-slate-200/80 bg-white/85 px-4 py-4">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Support
                          </div>
                          <div className="mt-2 text-sm font-semibold text-slate-950">
                            Help available
                          </div>
                        </div>
                      </div>

                      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <Link
                          href="/retrieve-policy"
                          className="btn-primary !text-white"
                        >
                          Existing documents
                        </Link>

                        <Link href="/get-quote" className="btn-ghost">
                          Enter vehicle details
                        </Link>

                        <a
                          href="mailto:support@coverza.uk"
                          className="btn-ghost"
                        >
                          Contact support
                        </a>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/88 px-6 py-6 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Email support
                      </div>

                      <div className="mt-3 whitespace-nowrap text-[1.02rem] font-semibold tracking-[-0.02em] text-slate-950">
                        support@coverza.uk
                      </div>

                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        Reach out for help with your document, delivery or
                        service scope.
                      </p>

                      <div className="mt-5">
                        <a
                          href="mailto:support@coverza.uk"
                          className="btn-ghost w-full justify-center"
                        >
                          Email support
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MotionConfig>
  );
}

/* Icons */
function IconCar() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6.5 16.5h11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7.2 7.8c.3-.8 1.1-1.3 2-1.3h5.6c.9 0 1.7.5 2 1.3l1.3 3.5c.2.6.4 1.2.4 1.8V17c0 .6-.4 1-1 1h-1.2a1 1 0 0 1-1-1v-.5H8.7v.5a1 1 0 0 1-1 1H6.5c-.6 0-1-.4-1-1v-2.4c0-.6.1-1.2.4-1.8l1.3-3.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 13h0"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M16 13h0"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M13 2L3 14h7l-1 8 12-14h-7l-1-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconId() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.5 7.5A2.5 2.5 0 0 1 7 5h10a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 17 19H7a2.5 2.5 0 0 1-2.5-2.5v-9Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 15c.8-1.2 2-2 4-2s3.2.8 4 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 10.2a2 2 0 1 0 4 0a2 2 0 0 0-4 0Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16.5 9h2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16.5 12h2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CoverOptionCard({
  eyebrow,
  title,
  desc,
  points,
  href,
  cta,
  icon,
  featured = false,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  points: string[];
  href: string;
  cta: string;
  icon: React.ReactNode;
  featured?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="group relative h-full"
    >
      <div
        className={[
          "relative flex h-full flex-col overflow-hidden rounded-[2rem] border p-6 sm:p-7",
          "transition-all duration-300",
          featured
            ? "border-[rgba(108,76,243,0.18)] bg-[linear-gradient(180deg,rgba(245,242,255,0.95),rgba(255,255,255,0.98))] shadow-[0_22px_60px_rgba(108,76,243,0.12)]"
            : "border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)] group-hover:border-[rgba(108,76,243,0.18)] group-hover:shadow-[0_20px_50px_rgba(15,23,42,0.10)]",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[rgba(108,76,243,0.08)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative flex h-full flex-col">
          <div
            className={[
              "inline-flex h-13 w-13 items-center justify-center rounded-[1.2rem] border text-[rgb(108,76,243)] shadow-sm transition-all duration-300",
              featured
                ? "border-[rgba(108,76,243,0.18)] bg-white shadow-[0_10px_26px_rgba(108,76,243,0.10)]"
                : "border-slate-200 bg-[rgba(248,250,252,0.9)] group-hover:scale-105 group-hover:border-[rgba(108,76,243,0.20)] group-hover:bg-white",
            ].join(" ")}
          >
            {icon}
          </div>

          <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {eyebrow}
          </div>

          <h3 className="mt-2 text-[1.9rem] font-extrabold tracking-[-0.04em] text-slate-950">
            {title}
          </h3>

          <p className="mt-3 text-[1.02rem] leading-8 text-slate-600">{desc}</p>

          <div className="mt-6 space-y-3">
            {points.map((point) => (
              <div key={point} className="flex items-start gap-3">
                <span className="mt-[0.55rem] h-2 w-2 rounded-full bg-[rgb(108,76,243)] transition-transform duration-300 group-hover:scale-125" />
                <span className="text-sm leading-7 text-slate-700">
                  {point}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-2">
            <Link
              href={href}
              className={[
                "inline-flex min-h-[3.25rem] w-full items-center justify-center rounded-[1rem] border px-5 py-3 text-base font-semibold transition-all duration-300",
                featured
                  ? "border-transparent bg-[linear-gradient(135deg,rgb(108,76,243)_0%,rgb(74,96,245)_100%)] !text-white shadow-[0_16px_34px_rgba(79,52,217,0.20)] group-hover:brightness-[1.03]"
                  : "border-slate-200 bg-white text-slate-900 group-hover:border-[rgba(108,76,243,0.18)] group-hover:bg-[rgba(108,76,243,0.04)] group-hover:text-[rgb(108,76,243)]",
              ].join(" ")}
            >
              {cta}
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ServiceDetailCard({
  name,
  location,
  scenario,
  quote,
  featured = false,
}: {
  name: string;
  location: string;
  scenario: string;
  quote: string;
  featured?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="group h-full"
    >
      <div
        className={[
          "flex h-full flex-col rounded-[1.9rem] border p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur transition-all duration-300 sm:p-7",
          featured
            ? "border-[rgba(108,76,243,0.18)] bg-[linear-gradient(180deg,rgba(245,242,255,0.95),rgba(255,255,255,0.92))] shadow-[0_18px_46px_rgba(108,76,243,0.10)]"
            : "border-slate-200/80 bg-white/78 hover:border-[rgba(108,76,243,0.16)] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold tracking-[-0.02em] text-slate-950 shadow-sm">
              {location}
            </div>

            <div>
              <div className="text-base font-semibold tracking-[-0.02em] text-slate-950">
                {name}
              </div>
              <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {scenario}
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[rgb(108,76,243)]">
            <span className="h-2 w-2 rounded-full bg-current opacity-100" />
            <span className="h-2 w-2 rounded-full bg-current opacity-80" />
            <span className="h-2 w-2 rounded-full bg-current opacity-60" />
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[1.02rem] leading-8 text-slate-700">{quote}</p>
        </div>
      </div>
    </motion.div>
  );
}

function FaqLineItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="group border-b border-slate-200/80 py-5">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
        <span className="text-[1rem] font-semibold tracking-[-0.02em] text-slate-950 sm:text-[1.04rem]">
          {question}
        </span>

        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition group-open:rotate-45">
          +
        </span>
      </summary>

      <div className="max-w-[42rem] pt-3 pr-10 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
        {answer}
      </div>
    </details>
  );
}
