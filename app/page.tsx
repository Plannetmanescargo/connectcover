/* /app/page.tsx */
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import QuoteWidget from "@/components/quote/QuoteWidget";

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
  "Eligibility, underwriting and acceptance apply. You’ll review your details before payment.";

const HERO_POINTS = [
  "Choose exact start times",
  "Flexible duration from 1 hour up to 12 months",
  "Documents issued instantly after purchase",
] as const;

const FEATURE_CARDS = [
  {
    title: "Choose your timing",
    desc: "Set your cover to start when you need it, with flexible duration options from 1 hour to 12 months.",
    icon: <IconClock />,
  },
  {
    title: "Flexible cover",
    desc: "Arrange temporary insurance around specific journeys, short-term use, learner practice or extra vehicle access.",
    icon: <IconBolt />,
  },
  {
    title: "Documents, instantly",
    desc: "After purchase, your certificate and policy documents are issued straight away and sent to your email.",
    icon: <IconDoc />,
  },
  {
    title: "Easy retrieval",
    desc: "Need your documents again later? Retrieve your policy details quickly without waiting around.",
    icon: <IconSearch />,
  },
] as const;

const STEPS = [
  {
    n: 1,
    title: "Check your vehicle",
    desc: "Enter your registration and confirm the vehicle details.",
    icon: <IconCar />,
  },
  {
    n: 2,
    title: "Choose your cover",
    desc: "Pick when it starts and how long you need it for.",
    icon: <IconClock />,
  },
  {
    n: 3,
    title: "See your quote",
    desc: "Review your details and check the price before you continue.",
    icon: <IconShield />,
  },
  {
    n: 4,
    title: "Get your documents",
    desc: "Pay securely and receive your documents instantly after purchase.",
    icon: <IconDoc />,
  },
] as const;

const USE_CASES = [
  "Borrowing a car",
  "Learner practice",
  "Short-term van use",
  "Cover needed today",
  "Extra vehicle access",
  "Specific time-window cover",
] as const;

const FAQS = [
  {
    q: "How quickly can I get covered?",
    a: "Most customers complete the quote journey in a few minutes. After payment, your documents are issued instantly and sent to your email.",
  },
  {
    q: "What do I need to get a quote?",
    a: "Usually your vehicle registration, cover start details, duration and your driver information. If vehicle lookup does not find your details, you can enter them manually.",
  },
  {
    q: "Can I choose an exact start time?",
    a: "Yes. You can choose when your cover should start, including a specific date and time.",
  },
  {
    q: "How do I retrieve my policy documents later?",
    a: "Use Retrieve policy to access your certificate and policy documents using your details or policy reference.",
  },
] as const;

export default function HomePage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen text-slate-900">
      <a
        href="#quote"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow-lg"
      >
        Skip to quote
      </a>

      <main className="bg-wash">
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
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={0.02}
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.16)] bg-[rgba(108,76,243,0.05)] px-3.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.20em] text-[rgb(108,76,243)]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
          Coverage that connects
        </motion.div>
 
        {/* Headline — tight, big, Apple-style */}
        <motion.h1
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={0.08}
          className="mt-5 text-[2.85rem] font-extrabold leading-[0.92] tracking-[-0.055em] text-slate-950 sm:text-[3.6rem] lg:text-[4.4rem]"
        >
          Cover that starts
          <br />
          <span className="text-[rgb(108,76,243)]">exactly when</span>
          <br />
          you need it.
        </motion.h1>
 
        {/* Sub */}
        <motion.p
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={0.14}
          className="mt-5 max-w-[30rem] text-[1rem] leading-[1.85] text-slate-500 sm:text-[1.05rem]"
        >
          Set your start time, choose your duration, and get your
          documents the moment you purchase. No annual policy
          affected — just clean, flexible cover when you need it.
        </motion.p>
 
        {/* CTA buttons */}
        <motion.div
          initial="hidden"
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
              Get your quote
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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
              Retrieve policy
            </Link>
          </motion.div>
        </motion.div>
 
        {/* Trust row — 3 micro stats, single line on mobile */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={0.22}
          className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-100 pt-6"
        >
          {[
            { val: "1hr", label: "Minimum cover" },
            { val: "12 months", label: "Maximum duration" },
            { val: "Instant", label: "Policy documents" },
          ].map(({ val, label }) => (
            <div key={label} className="flex items-baseline gap-2">
              <span className="text-[1.05rem] font-extrabold tracking-tight text-slate-950">
                {val}
              </span>
              <span className="text-[12px] text-slate-400">{label}</span>
            </div>
          ))}
        </motion.div>
 
        {/* Compliance */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={0.26}
          className="mt-5 max-w-[34rem] space-y-1 text-[11.5px] leading-[1.7] text-slate-400"
        >
          <div>{complianceLine}</div>
          <div>Flexible temporary insurance for clearer, more confident cover.</div>
        </motion.div>
      </div>
 
      {/* ════ RIGHT — premium visual block ════ */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeUp}
        custom={0.10}
        className="w-full xl:w-[420px] xl:shrink-0"
      >
        {/* Photo triptych — same images, new premium card treatment */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {[
            { src: "/images/hero-car-4.png", alt: "Driving in the city with Coverza" },
            { src: "/images/hero-car-5.png", alt: "Flexible temporary vehicle cover" },
            { src: "/images/hero-car-6.png", alt: "Temporary insurance designed for short-term use" },
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
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={0.20}
          className="mt-4 rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-[0_8px_40px_rgba(15,23,42,0.07)]"
        >
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Your cover, your timing
              </p>
              <p className="mt-0.5 text-[1.05rem] font-extrabold tracking-tight text-slate-950">
                Trusted online journey
              </p>
            </div>
            {/* Verified badge */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(108,76,243,0.08)]">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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
              { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "Set your exact start time" },
              { icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", label: "Choose how long you need cover" },
              { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 10.414V19a2 2 0 01-2 2z", label: "Receive documents instantly" },
            ].map(({ icon, label }, i) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-[0.85rem] bg-slate-50/80 px-3.5 py-2.5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgb(108,76,243)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={icon} />
                  </svg>
                </span>
                <span className="text-[12.5px] font-medium text-slate-700">{label}</span>
                <span className="ml-auto text-[11px] font-semibold text-[rgb(108,76,243)]">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
 
          {/* No-claims note */}
          <div className="mt-4 flex items-center gap-2 rounded-[0.85rem] bg-[rgba(108,76,243,0.05)] px-3.5 py-2.5">
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="rgb(108,76,243)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-[11.5px] font-medium text-[rgb(108,76,243)]">
              No impact on your existing no-claims discount
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
                  A clearer way to arrange temporary cover
                </h2>

                <p className="mt-5 max-w-[35rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
                  Coverza combines a calmer editorial feel with a modern,
                  product-led journey — making temporary insurance easier to quote,
                  easier to understand and easier to access later.
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
                        Timing
                      </div>
                    </div>

                    <div>
                      <div className="flex items-start gap-3">
                        <span className="mt-2 hidden h-2 w-2 shrink-0 rounded-full bg-[rgb(108,76,243)]/60 sm:block" />
                        <div>
                          <div className="text-[1.18rem] font-semibold leading-[1.08] tracking-[-0.03em] text-slate-950 sm:text-[1.34rem]">
                            Choose exact start times around your plans
                          </div>
                          <p className="mt-2.5 max-w-[37rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
                            Arrange cover for when you actually need it, without
                            adjusting your day around rigid options.
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
                            From 1 hour to 12 months, with one clear journey
                          </div>
                          <p className="mt-2.5 max-w-[37rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
                            Short-term cover should adapt to real driving needs,
                            whether it’s a quick trip, temporary use, or a longer stop-gap.
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
                            Review everything clearly before payment
                          </div>
                          <p className="mt-2.5 max-w-[37rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
                            Vehicle details, timing and quote information are presented
                            in a way that feels readable and easy to check.
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
                            Issued instantly and easy to retrieve later
                          </div>
                          <p className="mt-2.5 max-w-[37rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
                            Once purchased, your documents are available straight away
                            and remain easy to access whenever you need them again.
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
        Choose the cover that fits
      </div>

      <h2 className="mt-6 text-4xl font-extrabold tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-[4rem]">
        Flexible cover for different driving needs
      </h2>

      <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
        Whether you need cover for a car, van or learner driving, Coverza
        keeps the experience clear, flexible and easy to manage online.
      </p>
    </div>

    <div className="mt-12 grid gap-5 lg:grid-cols-3">
      <CoverOptionCard
        eyebrow="Learner cover"
        title="Learner driver insurance"
        desc="Temporary learner cover designed for short-term practice in a way that feels straightforward, flexible and easy to arrange."
        points={[
          "Ideal for short-term practice",
          "Clear quote journey",
          "Instant documents after purchase",
        ]}
        href="/learner"
        cta="Explore learner cover"
        icon={<IconId />}
      />

      <CoverOptionCard
        eyebrow="Car cover"
        title="Temporary car insurance"
        desc="Flexible short-term car cover for borrowing a car, driving today, or arranging insurance around a specific plan."
        points={[
          "Choose exact start times",
          "From 1 hour to 12 months",
          "Documents issued instantly",
        ]}
        href="/car"
        cta="Explore car cover"
        icon={<IconCar />}
        featured
      />

      <CoverOptionCard
        eyebrow="Van cover"
        title="Temporary van insurance"
        desc="Short-term van cover for practical use, moving plans, work needs, or temporary access to a vehicle you only need for a set period."
        points={[
          "Flexible short-term options",
          "Built for practical vehicle use",
          "Retrieve documents later anytime",
        ]}
        href="/van"
        cta="Explore van cover"
        icon={<IconBolt />}
      />
    </div>

    <div className="mt-10 flex justify-center">
      <Link href="#quote" className="btn-primary !text-white">
        Start your quote
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
                Built for real short-term driving moments
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Temporary cover is usually arranged for a specific reason. Coverza
                fits the situations people actually need it for.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="group rounded-[1.8rem] border border-slate-200/80 bg-white/78 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur transition-all duration-300 hover:border-[rgba(108,76,243,0.18)] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:p-7"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Borrowing
                </div>
                <div className="mt-3 text-[1.45rem] font-semibold leading-[1.08] tracking-[-0.035em] text-slate-950">
                  Borrowing a car for the day
                </div>
                <p className="mt-3 max-w-[32rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
                  Ideal when you need short-term cover for a car you do not drive regularly.
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
                  Learner practice in a familiar vehicle
                </div>
                <p className="mt-3 max-w-[32rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
                  Useful for learners who want more flexibility around when and where they practise.
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
                  Short-term van cover for a specific job
                </div>
                <p className="mt-3 max-w-[32rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
                  A clearer option when you only need van cover for a defined period or task.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="group rounded-[1.8rem] border border-slate-200/80 bg-white/78 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur transition-all duration-300 hover:border-[rgba(108,76,243,0.18)] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:p-7"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Immediate cover
                </div>
                <div className="mt-3 text-[1.45rem] font-semibold leading-[1.08] tracking-[-0.035em] text-slate-950">
                  Cover starting today
                </div>
                <p className="mt-3 max-w-[32rem] text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
                  Helpful when you need to arrange temporary insurance quickly and keep everything simple.
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
                Driver stories
              </div>

              <h2 className="mt-6 text-4xl font-extrabold tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-[4rem]">
                Trusted by drivers who need cover quickly
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Real short-term cover is often arranged for a real-life reason.
                Here are a few examples of how Coverza can help.
              </p>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              <TestimonialCard
                name="Amir"
                location="Birmingham"
                scenario="Borrowing a car"
                quote="I needed cover for a family car for the day and wanted something quick and easy to sort. The whole journey felt clear, and the documents came through straight after payment."
              />

              <TestimonialCard
                name="Sophie"
                location="Leeds"
                scenario="Learner practice"
                quote="I wanted temporary learner cover so I could get extra practice in a familiar car. It felt much easier to follow than I expected and was simple to arrange on my phone."
                featured
              />

              <TestimonialCard
                name="Daniel"
                location="Bristol"
                scenario="Same-day cover"
                quote="I needed temporary cover starting that day and didn’t want a long process. Being able to choose the timing and get documents instantly made it feel very straightforward."
              />
            </div>

            <div className="mt-10 flex flex-col items-center gap-3">
              <div className="text-[12px] text-slate-500">
                Short-term cover for real situations, with a clearer online journey.
              </div>

              <Link href="#quote" className="btn-primary !text-white">
                Start your quote
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
                  The final part of the journey should feel just as clear as the
                  first. Find quick answers, retrieve your documents later, or
                  get support if you need a hand.
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
                    question="How quickly can I get temporary cover?"
                    answer="Most people can complete the journey in minutes. Once purchased, documents are issued instantly."
                  />
                  <FaqLineItem
                    question="Can I choose an exact start time?"
                    answer="Yes. You can choose exactly when your temporary cover should begin, so it fits around your plans."
                  />
                  <FaqLineItem
                    question="How do I retrieve my documents later?"
                    answer="If you have already purchased cover, you can retrieve your policy documents again through the retrieval journey without starting over."
                  />
                  <FaqLineItem
                    question="What details do I need to start?"
                    answer="Usually your registration and the main driver and cover details needed to begin your quote."
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
                      Already purchased cover?
                    </div>

                    <h3 className="mt-3 text-[2rem] font-extrabold leading-[0.96] tracking-[-0.05em] text-slate-950 sm:text-[2.35rem] lg:whitespace-nowrap">
                      Retrieve documents or get support anytime
                    </h3>

                    <p className="mt-4 max-w-[40rem] text-[1rem] leading-8 text-slate-600">
                      If you have already bought cover, you can retrieve your policy
                      documents again without needing to start over. If you need help,
                      our support team is also easy to reach.
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
                          Issued instantly
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
                      <Link href="/retrieve-policy" className="btn-primary !text-white">
                        Retrieve policy
                      </Link>

                      <Link href="#quote" className="btn-ghost">
                        Start your quote
                      </Link>

                      <a href="mailto:support@coverza.com" className="btn-ghost">
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
                      support@coverza.com
                    </div>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      Reach out if you need help with your quote, documents, or retrieval.
                    </p>

                    <div className="mt-5">
                      <a
                        href="mailto:support@coverza.com"
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
      </main>
    </div>
  );
}

function HeroPoint({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[rgb(108,76,243)]" />
        <div className="text-[12px] font-semibold text-slate-900">{text}</div>
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm">
        {icon}
      </div>
      <div className="mt-4 text-base font-extrabold text-slate-900">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
    </div>
  );
}

function StepCard({
  n,
  title,
  desc,
  icon,
}: {
  n: number;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 shadow-sm">
        {icon}
      </div>
      <div className="mt-5 text-xl font-extrabold tracking-tight text-slate-900">
        {n}. {title}
      </div>
      <div className="mt-2 text-sm leading-6 text-slate-600">{desc}</div>
    </div>
  );
}

function UseCaseCard({ text }: { text: string }) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 px-4 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-1 h-2 w-2 rounded-full bg-[rgb(108,76,243)]" />
        <div className="text-sm font-medium text-slate-800">{text}</div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-4">
          <div className="text-sm font-extrabold text-slate-900">{q}</div>
          <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition group-open:rotate-45">
            +
          </span>
        </div>
      </summary>
      <div className="mt-3 text-sm leading-6 text-slate-700">{a}</div>
    </details>
  );
}

function InfoRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50"
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </Link>
  );
}

/* Icons */
function IconCar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6.5 16.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M7.2 7.8c.3-.8 1.1-1.3 2-1.3h5.6c.9 0 1.7.5 2 1.3l1.3 3.5c.2.6.4 1.2.4 1.8V17c0 .6-.4 1-1 1h-1.2a1 1 0 0 1-1-1v-.5H8.7v.5a1 1 0 0 1-1 1H6.5c-.6 0-1-.4-1-1v-2.4c0-.6.1-1.2.4-1.8l1.3-3.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M8 13h0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M16 13h0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l8 4v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V7l8-4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13 2L3 14h7l-1 8 12-14h-7l-1-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconId() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 7.5A2.5 2.5 0 0 1 7 5h10a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 17 19H7a2.5 2.5 0 0 1-2.5-2.5v-9Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M8 15c.8-1.2 2-2 4-2s3.2.8 4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 10.2a2 2 0 1 0 4 0a2 2 0 0 0-4 0Z" stroke="currentColor" strokeWidth="2" />
      <path d="M16.5 9h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16.5 12h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

          <p className="mt-3 text-[1.02rem] leading-8 text-slate-600">
            {desc}
          </p>

          <div className="mt-6 space-y-3">
            {points.map((point) => (
              <div key={point} className="flex items-start gap-3">
                <span className="mt-[0.55rem] h-2 w-2 rounded-full bg-[rgb(108,76,243)] transition-transform duration-300 group-hover:scale-125" />
                <span className="text-sm leading-7 text-slate-700">{point}</span>
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

function TestimonialCard({
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
              {name.charAt(0)}
            </div>

            <div>
              <div className="text-base font-semibold tracking-[-0.02em] text-slate-950">
                {name} from {location}
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
          <p className="text-[1.02rem] leading-8 text-slate-700">
            “{quote}”
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function FaqCard({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="group rounded-[1.4rem] border border-slate-200/80 bg-white/78 px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all duration-300 open:bg-white">
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-4">
          <div className="text-[1rem] font-semibold tracking-[-0.02em] text-slate-950">
            {question}
          </div>

          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-transform duration-300 group-open:rotate-45">
            +
          </span>
        </div>
      </summary>

      <div className="mt-3 max-w-[42rem] text-sm leading-7 text-slate-600">
        {answer}
      </div>
    </details>
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