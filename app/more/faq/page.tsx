// app/more/faq/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/site/PageShell";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Clock3,
  Shield,
  FileText,
  CreditCard,
  RefreshCw,
  Search,
  Truck,
  GraduationCap,
  Building2,
  AlertTriangle,
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

const SECTIONS: readonly FAQSection[] = [
  {
    id: "cover",
    title: "Cover & timings",
    description:
      "Answers about when cover starts, ends, how temporary cover works, and what happens if your plans change.",
    icon: <Clock3 className="h-5 w-5" />,
    items: [
      {
        q: "When does my cover start?",
        a: (
          <>
            Your cover starts at the exact date and time you choose during the quote
            journey. Always double-check the selected start time before purchase.
          </>
        ),
        keywords: ["start", "begin", "start time", "cover starts"],
        featured: true,
      },
      {
        q: "When does my cover end?",
        a: (
          <>
            Your cover ends at the exact end date and time shown on your policy.
            If you need longer cover, you would usually need to arrange a new quote.
          </>
        ),
        keywords: ["end", "finish", "expiry", "cover ends"],
      },
      {
        q: "Can I choose exact start and end times?",
        a: (
          <>
            Yes. You can choose exact times during your quote, which helps you fit
            the cover around your plans more precisely.
          </>
        ),
        keywords: ["exact times", "hours", "timing"],
      },
      {
        q: "Can I start cover immediately?",
        a: (
          <>
            In many cases, yes. You can usually choose a start time close to now,
            subject to product availability and insurer acceptance.
          </>
        ),
        keywords: ["start now", "immediately", "instant"],
      },
      {
        q: "Is temporary cover the same as annual insurance?",
        a: (
          <>
            No. Temporary cover is designed for shorter periods, while annual
            insurance is intended for longer-term ongoing use.
          </>
        ),
        keywords: ["annual", "temporary vs annual", "difference"],
      },
      {
        q: "Can I extend cover instead of buying a new policy?",
        a: (
          <>
            This depends on the insurer and product. In many cases, the safest
            assumption is that you may need to arrange a new quote rather than rely
            on an extension being available.
          </>
        ),
        keywords: ["extend", "extension", "longer", "renew"],
      },
      {
        q: "Does temporary cover replace the owner’s existing insurance?",
        a: (
          <>
            Temporary cover is usually separate from any existing policy already on
            the vehicle. The vehicle owner should not assume their own policy is
            replaced or changed unless their insurer confirms that directly.
          </>
        ),
        keywords: ["replace insurance", "owners policy", "existing insurance"],
      },
      {
        q: "Can I insure more than one vehicle on the same temporary policy?",
        a: (
          <>
            Temporary cover is normally arranged for one vehicle at a time. If you
            need cover for a different vehicle, you would usually need a separate
            quote and policy.
          </>
        ),
        keywords: ["more than one car", "multiple vehicles", "same policy"],
      },
    ],
  },
  {
    id: "eligibility",
    title: "Eligibility & acceptance",
    description:
      "Common questions about who may be able to buy cover, licence types, and how insurer acceptance works.",
    icon: <Shield className="h-5 w-5" />,
    items: [
      {
        q: "Who can buy temporary insurance?",
        a: (
          <>
            Eligibility depends on insurer rules. Common factors include age,
            licence type, driving history, vehicle details, and the product you
            are trying to buy.
          </>
        ),
        keywords: ["eligible", "eligibility", "age", "licence"],
        featured: true,
      },
      {
        q: "What licence types do you support?",
        a: (
          <>
            This depends on the product. Some journeys are designed for UK licence
            holders, while others may support learner or other licence types where
            available.
          </>
        ),
        keywords: ["licence", "UK", "international", "learner"],
      },
      {
        q: "Can I insure a vehicle that is not registered to me?",
        a: (
          <>
            Often yes, especially for temporary cover. You must still have
            permission to drive the vehicle and meet the insurer’s requirements.
          </>
        ),
        keywords: ["not my car", "borrow", "registered to me"],
      },
      {
        q: "Is acceptance guaranteed?",
        a: (
          <>
            No. Insurance is always subject to underwriting and insurer acceptance.
            Availability depends on the details entered during your quote.
          </>
        ),
        keywords: ["guaranteed", "acceptance", "underwriting"],
      },
      {
        q: "Is there a minimum or maximum age?",
        a: (
          <>
            Age limits depend on the insurer and product. Some products may be more
            restrictive than others, so eligibility should always be checked during
            the quote journey.
          </>
        ),
        keywords: ["minimum age", "maximum age", "too young", "too old"],
      },
      {
        q: "Can I still get cover if I have points or previous claims?",
        a: (
          <>
            It depends on the insurer’s rules. Some driving history may still be
            acceptable, while other details could affect availability or price.
          </>
        ),
        keywords: ["points", "claims", "convictions", "driving history"],
      },
      {
        q: "Can I buy cover if I live outside the UK?",
        a: (
          <>
            This depends on the product rules and insurer requirements. Residency,
            licence details, and address information may all affect eligibility.
          </>
        ),
        keywords: ["outside uk", "residency", "live abroad"],
      },
    ],
  },
  {
    id: "vehicle",
    title: "Vehicle lookup & details",
    description:
      "Help with registration lookups, manual entry, and making sure vehicle details match correctly.",
    icon: <Search className="h-5 w-5" />,
    items: [
      {
        q: "My registration lookup did not find my vehicle — what should I do?",
        a: (
          <>
            You can usually continue by entering the vehicle details manually. A
            failed lookup does not automatically mean you cannot be insured.
          </>
        ),
        keywords: ["lookup", "not found", "registration", "vrm"],
        featured: true,
      },
      {
        q: "Why might my vehicle not appear in lookup?",
        a: (
          <>
            This can happen if registration data is delayed, new, incomplete, or
            unusual. Manual entry is provided so you can still continue.
          </>
        ),
        keywords: ["DVLA", "new plate", "not showing"],
      },
      {
        q: "What if the vehicle details look wrong?",
        a: (
          <>
            Correct any mismatches before purchase. Your documents should match the
            vehicle and driver details accurately.
          </>
        ),
        keywords: ["wrong details", "incorrect", "mismatch"],
      },
      {
        q: "What details should I double-check before paying?",
        a: (
          <>
            Pay close attention to the registration, make, model, year, start time,
            end time, your name, date of birth, and email address. These details
            should match the driver and vehicle being insured.
          </>
        ),
        keywords: ["check details", "before paying", "verify"],
      },
    ],
  },
  {
    id: "documents",
    title: "Documents & retrieval",
    description:
      "Information on certificates, email delivery, retrieval, and what to do if documents do not arrive.",
    icon: <FileText className="h-5 w-5" />,
    items: [
      {
        q: "How do I get my policy documents?",
        a: (
          <>
            After purchase, your documents are typically issued instantly and sent
            to your email. You can also retrieve them later if needed.
          </>
        ),
        keywords: ["documents", "certificate", "email"],
        featured: true,
      },
      {
        q: "How do I retrieve my policy documents later?",
        a: (
          <>
            Use the{" "}
            <Link href="/retrieve-policy" className="link font-medium">
              Retrieve policy
            </Link>{" "}
            page and enter the required details to access your documents again.
          </>
        ),
        keywords: ["retrieve", "download", "policy documents"],
      },
      {
        q: "What documents will I receive?",
        a: (
          <>
            This depends on the insurer and product, but it commonly includes a
            certificate of insurance and supporting policy documents.
          </>
        ),
        keywords: ["certificate", "schedule", "terms"],
      },
      {
        q: "Will my cover show on the MID immediately?",
        a: (
          <>
            MID update times can vary. Your official policy documents remain the
            main proof of cover after purchase, so keep them available.
          </>
        ),
        keywords: ["MID", "motor insurance database"],
      },
      {
        q: "I did not receive my email — what should I do?",
        a: (
          <>
            Check spam or junk first. If it is not there, try the{" "}
            <Link href="/retrieve-policy" className="link font-medium">
              Retrieve policy
            </Link>{" "}
            journey or contact{" "}
            <Link href="/help-support" className="link font-medium">
              Help & Support
            </Link>
            .
          </>
        ),
        keywords: ["email not received", "spam", "junk"],
      },
      {
        q: "What details do I need to retrieve my documents?",
        a: (
          <>
            The retrieval journey usually asks for key details such as your policy
            number and the email address used for purchase. Follow the instructions
            shown on the retrieval page.
          </>
        ),
        keywords: ["policy number", "retrieve details", "find documents"],
      },
      {
        q: "Can I download my documents more than once?",
        a: (
          <>
            In most cases, yes. If you can successfully retrieve the policy, you
            should usually be able to access your documents again when needed.
          </>
        ),
        keywords: ["download again", "multiple times", "re-download"],
      },
      {
        q: "What should I do if I cannot find my policy reference?",
        a: (
          <>
            Check your confirmation email first. If you still cannot find it, try
            the retrieval journey using the details requested there or contact
            support for help.
          </>
        ),
        keywords: ["missing policy reference", "lost reference", "reference"],
      },
    ],
  },
  {
    id: "payments",
    title: "Payments & checkout",
    description:
      "Pricing, payment timing, accepted cards, checkout security, and what happens if payment fails.",
    icon: <CreditCard className="h-5 w-5" />,
    items: [
      {
        q: "When do I pay?",
        a: (
          <>
            You will see the total before checkout. Payment is taken securely during
            checkout, and documents are issued after successful purchase.
          </>
        ),
        keywords: ["pay", "payment", "checkout"],
        featured: true,
      },
      {
        q: "Is VAT included in the displayed price?",
        a: (
          <>
            Where shown, pricing is displayed clearly before payment. Review the
            total carefully during checkout.
          </>
        ),
        keywords: ["VAT", "tax", "price"],
      },
      {
        q: "Why did my payment fail?",
        a: (
          <>
            Common reasons include bank checks, insufficient funds, or security
            verification issues. You may need to retry or use another card.
          </>
        ),
        keywords: ["declined", "failed", "payment issue"],
      },
      {
        q: "What payment methods do you accept?",
        a: (
          <>
            Accepted payment methods depend on the checkout setup shown at the time
            of purchase. The secure checkout page will display the options
            available to you.
          </>
        ),
        keywords: ["cards", "payment methods", "visa", "mastercard"],
      },
      {
        q: "Is payment secure?",
        a: (
          <>
            Yes, payment is handled through a secure checkout flow. Always make
            sure you are completing payment on the official Connect Cover checkout
            page before entering card details.
          </>
        ),
        keywords: ["secure payment", "safe", "checkout secure"],
      },
      {
        q: "Will I receive a payment receipt or confirmation?",
        a: (
          <>
            You should normally receive confirmation after successful checkout, and
            your policy documents are typically sent by email as part of the
            purchase flow.
          </>
        ),
        keywords: ["receipt", "confirmation", "payment email"],
      },
    ],
  },
  {
    id: "changes",
    title: "Changes, cancellations & refunds",
    description:
      "What to know about changing details, cancelling policies, and possible refund questions after purchase.",
    icon: <RefreshCw className="h-5 w-5" />,
    items: [
      {
        q: "Can I change the start or end time after purchase?",
        a: (
          <>
            This depends on the policy terms. In many cases, changes are limited
            once a policy is active, so always check your details carefully before
            purchase.
          </>
        ),
        keywords: ["change", "edit", "amend", "times"],
      },
      {
        q: "Can I cancel my policy?",
        a: (
          <>
            Cancellation rules vary by insurer and product. If you need guidance,
            contact{" "}
            <Link href="/help-support" className="link font-medium">
              Help & Support
            </Link>{" "}
            and have your policy details ready.
          </>
        ),
        keywords: ["cancel", "cancellation"],
        featured: true,
      },
      {
        q: "Will I get a refund if I cancel?",
        a: (
          <>
            Refund eligibility depends on the product rules and insurer terms,
            including whether cover has already started.
          </>
        ),
        keywords: ["refund", "money back"],
      },
      {
        q: "What if I entered the wrong detail before payment?",
        a: (
          <>
            Correct any incorrect information before you complete purchase. It is
            much easier to fix details before checkout than after a policy has been
            issued.
          </>
        ),
        keywords: ["wrong detail", "mistake", "before payment"],
      },
    ],
  },
  {
    id: "learner",
    title: "Learner cover",
    description:
      "Common learner questions including supervision, family vehicles, and how learner cover is typically used.",
    icon: <GraduationCap className="h-5 w-5" />,
    items: [
      {
        q: "Does learner cover require supervision?",
        a: (
          <>
            Learner driving must follow the applicable legal requirements, including
            proper supervision where required.
          </>
        ),
        keywords: ["learner", "supervised", "supervision"],
        featured: true,
      },
      {
        q: "Can I use learner cover in a family member’s car?",
        a: (
          <>
            Often yes, provided you meet the product requirements and have
            permission to use the vehicle.
          </>
        ),
        keywords: ["family car", "parents car", "borrow"],
      },
      {
        q: "Does learner cover usually protect the vehicle owner’s no claims bonus?",
        a: (
          <>
            Product features can vary, so always check the wording and key details
            shown for the learner cover journey you are using.
          </>
        ),
        keywords: ["no claims", "ncb", "owners bonus"],
      },
    ],
  },
  {
    id: "van",
    title: "Van cover",
    description:
      "Short-term van questions including moving house, permitted use, and whether business use may be allowed.",
    icon: <Truck className="h-5 w-5" />,
    items: [
      {
        q: "Can I use temporary van cover for moving house?",
        a: (
          <>
            Yes, this is a common temporary cover use case. Make sure the product
            and permitted use fit your needs.
          </>
        ),
        keywords: ["moving house", "van hire", "move"],
        featured: true,
      },
      {
        q: "Can I use temporary van cover for work?",
        a: (
          <>
            It depends on the product. If you need business use, make sure the
            chosen policy allows it and review the wording carefully before buying.
          </>
        ),
        keywords: ["work", "business use", "trades"],
      },
      {
        q: "Is van cover only for private use?",
        a: (
          <>
            Not always. Some products may support different permitted uses, but you
            should never assume business use is included unless it is clearly shown
            in the policy details.
          </>
        ),
        keywords: ["private use", "business use included", "van use"],
      },
    ],
  },
  {
    id: "car",
    title: "Car cover",
    description:
      "Typical questions about borrowing cars, one-off journeys, and short-term car insurance use cases.",
    icon: <CarFront className="h-5 w-5" />,
    items: [
      {
        q: "Can I get temporary car insurance for borrowing a car?",
        a: (
          <>
            Often yes. Temporary car insurance can be useful when driving a car you
            do not usually insure yourself, subject to eligibility and acceptance.
          </>
        ),
        keywords: ["borrowing", "borrowed car", "temporary car insurance"],
        featured: true,
      },
      {
        q: "Can I get temporary car cover for a one-off trip?",
        a: (
          <>
            Yes. Temporary car cover is often arranged for one-off journeys,
            collections, visits, or other short-term driving needs.
          </>
        ),
        keywords: ["one-off trip", "day trip", "single journey"],
      },
      {
        q: "Can I drive someone else’s car with temporary cover?",
        a: (
          <>
            Often yes, provided you have permission to use the vehicle and meet the
            insurer’s eligibility requirements for that quote.
          </>
        ),
        keywords: ["someone elses car", "drive other car", "borrowed vehicle"],
      },
    ],
  },
  {
    id: "impound",
    title: "Impound cover",
    description:
      "Questions about insurance used for impound release, likely requirements, and what compounds may ask to see.",
    icon: <Building2 className="h-5 w-5" />,
    items: [
      {
        q: "What is impound insurance used for?",
        a: (
          <>
            Impound insurance is usually arranged to help release a vehicle from an
            impound or recovery situation, where specific requirements may apply.
          </>
        ),
        keywords: ["impound", "compound", "release"],
        featured: true,
      },
      {
        q: "What documents might the compound ask for?",
        a: (
          <>
            Requirements vary, but compounds may ask for identity, proof of address,
            and valid insurance documents. Always check with the compound directly.
          </>
        ),
        keywords: ["proof of address", "ID", "compound documents"],
      },
      {
        q: "Do all compounds accept the same insurance requirements?",
        a: (
          <>
            No. Requirements can vary, which is why it is important to check the
            specific release conditions with the compound handling the vehicle.
          </>
        ),
        keywords: ["compound requirements", "same rules", "acceptance"],
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    description:
      "Quick fixes for common issues with quotes, checkout, layouts, missing emails, and general page problems.",
    icon: <AlertTriangle className="h-5 w-5" />,
    items: [
      {
        q: "My quote will not load or looks stuck — what should I do?",
        a: (
          <>
            Refresh the page, check your connection, and try again. If the issue
            continues, try another browser or device.
          </>
        ),
        keywords: ["stuck", "loading", "not working"],
        featured: true,
      },
      {
        q: "Something on the page does not look right on my device — what should I do?",
        a: (
          <>
            Try refreshing or switching device/browser first. If the issue
            continues, contact support and tell us what device and browser you are
            using.
          </>
        ),
        keywords: ["layout", "mobile", "button", "display issue"],
      },
      {
        q: "Why am I seeing a validation error on my details?",
        a: (
          <>
            Validation errors usually mean a required field is incomplete or the
            format entered does not match what is expected. Review each field
            carefully and correct anything highlighted.
          </>
        ),
        keywords: ["validation", "error", "field error", "details invalid"],
      },
      {
        q: "Why did my quote change after I edited my dates?",
        a: (
          <>
            Changing start or end times can affect the length of cover, which may
            change the price shown. Review the updated quote carefully before
            continuing.
          </>
        ),
        keywords: ["price changed", "edited dates", "quote changed"],
      },
      {
        q: "What should I do if checkout does not open?",
        a: (
          <>
            Try refreshing the page and retrying. If the issue continues, try
            another browser or device and make sure pop-up or browser security
            settings are not interfering with checkout.
          </>
        ),
        keywords: ["checkout not opening", "payment page", "continue not working"],
      },
    ],
  },
] as const;

/* =========================================================
   Small UI
========================================================= */

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
                Popular
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
    []
  );

  const featuredItems = useMemo(() => {
    return SECTIONS.flatMap((section) =>
      section.items
        .filter((item) => item.featured)
        .map((item) => ({
          sectionId: section.id,
          sectionTitle: section.title,
          q: item.q,
        }))
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
          return q.includes(needle) || k.includes(needle);
        });
        return { ...section, items };
      })
      .filter((section) => section.items.length > 0);
  }, [query, activeSection]);

  const totalResults = useMemo(
    () => filteredSections.reduce((sum, section) => sum + section.items.length, 0),
    [filteredSections]
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
            Browse every Connect Cover FAQ on one page, from documents and timings
            to learner, van, car, impound and checkout questions.
          </p>

          <div className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,560px)_auto] lg:items-end lg:justify-between">
            <div className="min-w-0">
<div className="relative">
  <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400">
    <Search size={18} />
  </span>

  <input
    className="input h-14 w-full !pl-14 pr-4"
    placeholder="Search FAQs (e.g. documents, MID, cancel, start time)…"
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
                Retrieve policy
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
                Popular questions
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
              Try a different keyword such as documents, start time, cancel,
              impound, learner, MID, refund, or payment.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {["documents", "start time", "cancel", "impound", "MID", "payment"].map(
                (term) => (
                  <button
                    key={term}
                    type="button"
                    className="btn-ghost"
                    onClick={() => setQuery(term)}
                  >
                    {term}
                  </button>
                )
              )}
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
                Start with policy retrieval if you already bought cover. If you
                still need a hand, our support team is easy to reach.
              </p>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/help-support" className="btn-ghost">
                Help & Support
              </Link>

              <Link href="/retrieve-policy" className="btn-ghost">
                Retrieve policy
              </Link>

              <Link href="/get-quote" className="btn-primary !text-white">
                Get a quote
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