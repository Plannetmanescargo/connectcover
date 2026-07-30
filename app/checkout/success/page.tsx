import Link from "next/link";

import PageShell from "@/components/site/PageShell";
import { prisma } from "@/db/prisma";

import AutoRefresh from "./AutoRefresh";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SuccessSearchParams = {
  checkout_id?: string;
  session_id?: string;
  provider?: string;
};

type ConfirmedPolicy = {
  policyNumber: string;
  email: string;
  vrm: string;
  make: string | null;
  model: string | null;
  year: string | null;
  startAt: Date;
  endAt: Date;
};

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */

function fmt(date: Date): string {
  return new Date(date).toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function vehicleLine(policy: {
  vrm: string;
  make: string | null;
  model: string | null;
  year: string | null;
}): string {
  const makeAndModel = [
    policy.make,
    policy.model,
  ]
    .filter(Boolean)
    .join(" ");

  return `${policy.vrm}${
    makeAndModel
      ? ` · ${makeAndModel}`
      : ""
  }${
    policy.year
      ? ` · ${policy.year}`
      : ""
  }`;
}

/**
 * Square redirects back with our own PaymentCheckout ID:
 *
 * /checkout/success?provider=square&checkout_id=...
 *
 * The Square webhook then:
 *
 * 1. confirms the completed payment;
 * 2. creates the Policy;
 * 3. writes the resulting policyId to PaymentCheckout.
 */
async function findSquarePolicy(
  checkoutId: string
): Promise<ConfirmedPolicy | null> {
  const checkout =
    await prisma.paymentCheckout.findUnique({
      where: {
        id: checkoutId,
      },
      select: {
        brand: true,
        status: true,
        paymentProvider: true,
        policyId: true,
        squarePaymentId: true,
      },
    });

  if (
    !checkout ||
    checkout.brand !== "coverza" ||
    checkout.paymentProvider !== "SQUARE" ||
    checkout.status !== "PAID"
  ) {
    return null;
  }

  if (checkout.policyId) {
    return prisma.policy.findUnique({
      where: {
        id: checkout.policyId,
      },
      select: {
        policyNumber: true,
        email: true,
        vrm: true,
        make: true,
        model: true,
        year: true,
        startAt: true,
        endAt: true,
      },
    });
  }

  /*
   * Defensive fallback:
   *
   * If the webhook created the policy but failed before
   * writing policyId to PaymentCheckout, find the policy
   * using the verified Square payment ID.
   */
  if (checkout.squarePaymentId) {
    return prisma.policy.findUnique({
      where: {
        paymentProvider_paymentId: {
          paymentProvider: "SQUARE",
          paymentId:
            checkout.squarePaymentId,
        },
      },
      select: {
        policyNumber: true,
        email: true,
        vrm: true,
        make: true,
        model: true,
        year: true,
        startAt: true,
        endAt: true,
      },
    });
  }

  return null;
}

/**
 * Temporary legacy support for old Stripe links:
 *
 * /checkout/success?session_id=cs_...
 */
async function findLegacyStripePolicy(
  sessionId: string
): Promise<ConfirmedPolicy | null> {
  return prisma.policy.findUnique({
    where: {
      paymentProvider_paymentId: {
        paymentProvider: "STRIPE",
        paymentId: sessionId,
      },
    },
    select: {
      policyNumber: true,
      email: true,
      vrm: true,
      make: true,
      model: true,
      year: true,
      startAt: true,
      endAt: true,
    },
  });
}

/* ─────────────────────────────────────────────────────────
   Processing state
───────────────────────────────────────────────────────── */

function ProcessingView() {
  const steps = [
    {
      label: "Payment processed",
      description:
        "Your payment has been securely confirmed.",
      state: "complete" as const,
    },
    {
      label: "Creating your policy",
      description:
        "We’re registering your cover details now.",
      state: "active" as const,
    },
    {
      label: "Generating documents",
      description:
        "Your certificate and policy files are being prepared.",
      state: "pending" as const,
    },
    {
      label: "Sending your email",
      description:
        "Your documents will be delivered automatically.",
      state: "pending" as const,
    },
  ];

  return (
    <PageShell
      hideHero
      crumbs={[
        {
          label: "Home",
          href: "/",
        },
        {
          label: "Payment confirmed",
        },
      ]}
    >
      <section className="relative overflow-hidden pb-8 pt-2 sm:pb-12 sm:pt-6 lg:pb-16 lg:pt-8">
        <div
          className="pointer-events-none absolute left-1/2 top-[-180px] h-[460px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(108,76,243,0.13)_0%,rgba(108,76,243,0.04)_42%,rgba(108,76,243,0)_72%)]"
          aria-hidden="true"
        />

        <div className="relative mx-auto w-full max-w-[620px]">
          <div className="flex justify-center">
            <div className="relative flex h-[92px] w-[92px] items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[rgba(108,76,243,0.06)]" />

              <div className="absolute inset-[9px] animate-pulse rounded-full bg-[rgba(108,76,243,0.08)]" />

              <div className="relative flex h-[58px] w-[58px] items-center justify-center rounded-full border border-[rgba(108,76,243,0.14)] bg-white shadow-[0_12px_34px_rgba(108,76,243,0.16)]">
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 30 30"
                  fill="none"
                  aria-hidden="true"
                  className="animate-spin"
                  style={{
                    animationDuration: "1.4s",
                  }}
                >
                  <circle
                    cx="15"
                    cy="15"
                    r="11.5"
                    stroke="rgba(108,76,243,0.16)"
                    strokeWidth="3"
                  />

                  <path
                    d="M15 3.5A11.5 11.5 0 0 1 26.5 15"
                    stroke="rgb(108,76,243)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-6 flex w-full flex-col items-center text-center">
            <div className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(108,76,243,0.16)] bg-white/80 px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[rgb(108,76,243)] shadow-[0_8px_24px_rgba(108,76,243,0.06)] backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[rgb(108,76,243)] opacity-35" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[rgb(108,76,243)]" />
              </span>

              Payment confirmed
            </div>

            <h1 className="mx-auto mt-6 w-full max-w-[11ch] text-center text-[2.65rem] font-extrabold leading-[0.92] tracking-[-0.065em] text-slate-950 sm:text-[3.6rem]">
              We’re preparing your cover.
            </h1>

            <p className="mx-auto mt-5 w-full max-w-[500px] text-center text-[0.98rem] leading-7 text-slate-500 sm:text-[1.05rem]">
              Your payment is complete. We’re creating your policy,
              generating the documents and sending everything to your
              inbox.
            </p>
          </div>

          <div className="mt-9 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)]">
            <div className="border-b border-slate-100 bg-[linear-gradient(135deg,rgba(108,76,243,0.055),rgba(255,255,255,0.7))] px-6 py-5 text-center sm:px-7">
              <div className="flex flex-col items-center justify-center">
                <div className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(108,76,243,0.12)] bg-white px-3 py-1.5 text-[11px] font-semibold text-[rgb(108,76,243)] shadow-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[rgb(108,76,243)] opacity-30" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                  </span>

                  Processing
                </div>

                <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[rgb(108,76,243)]">
                  Policy progress
                </p>

                <p className="mt-1 text-center text-[13px] text-slate-500">
                  This usually completes within a few seconds.
                </p>
              </div>
            </div>

            <div className="px-5 py-3 sm:px-7">
              {steps.map(
                (
                  {
                    label,
                    description,
                    state,
                  },
                  index
                ) => {
                  const isComplete =
                    state === "complete";

                  const isActive =
                    state === "active";

                  return (
                    <div
                      key={label}
                      className="relative flex gap-4 py-4"
                    >
                      {index <
                        steps.length - 1 && (
                        <div
                          className={[
                            "absolute left-[15px] top-[46px] h-[calc(100%-22px)] w-px",
                            isComplete
                              ? "bg-[rgba(108,76,243,0.28)]"
                              : "bg-slate-200",
                          ].join(" ")}
                          aria-hidden="true"
                        />
                      )}

                      <div className="relative z-10 mt-0.5 shrink-0">
                        {isComplete ? (
                          <div className="flex h-[31px] w-[31px] items-center justify-center rounded-full bg-[rgb(108,76,243)] shadow-[0_8px_18px_rgba(108,76,243,0.24)]">
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 15 15"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M3 7.7 6.1 10.6 12 4.6"
                                stroke="#fff"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        ) : isActive ? (
                          <div className="relative flex h-[31px] w-[31px] items-center justify-center">
                            <span className="absolute inset-0 animate-ping rounded-full bg-[rgba(108,76,243,0.22)]" />

                            <span className="relative flex h-[31px] w-[31px] items-center justify-center rounded-full border-2 border-[rgba(108,76,243,0.28)] bg-white">
                              <span className="h-2.5 w-2.5 rounded-full bg-[rgb(108,76,243)]" />
                            </span>
                          </div>
                        ) : (
                          <div className="flex h-[31px] w-[31px] items-center justify-center rounded-full border-2 border-slate-200 bg-white">
                            <span className="h-2 w-2 rounded-full bg-slate-200" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p
                            className={[
                              "text-[14px] font-semibold",
                              isComplete ||
                              isActive
                                ? "text-slate-950"
                                : "text-slate-400",
                            ].join(" ")}
                          >
                            {label}
                          </p>

                          {isComplete && (
                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                              Done
                            </span>
                          )}

                          {isActive && (
                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[rgb(108,76,243)]">
                              In progress
                            </span>
                          )}
                        </div>

                        <p
                          className={[
                            "mt-1 text-[12.5px] leading-5",
                            isComplete ||
                            isActive
                              ? "text-slate-500"
                              : "text-slate-300",
                          ].join(" ")}
                        >
                          {description}
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          <div className="mt-5 rounded-[1.4rem] border border-[rgba(108,76,243,0.10)] bg-[rgba(108,76,243,0.035)] px-5 py-4 text-center">
            <p className="text-[12.5px] leading-6 text-slate-500">
              Keep this tab open. The page will update automatically
              as soon as your policy is ready.
            </p>
          </div>

          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-h-[50px] items-center justify-center rounded-full border border-slate-200 bg-white px-7 text-[14px] font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
            >
              Back to home
            </Link>

            <Link
              href="/retrieve-policy"
              className="inline-flex min-h-[50px] items-center justify-center rounded-full border border-[rgba(108,76,243,0.18)] bg-[rgba(108,76,243,0.05)] px-7 text-[14px] font-semibold text-[rgb(108,76,243)] transition hover:-translate-y-0.5 hover:bg-[rgba(108,76,243,0.09)]"
            >
              Retrieve policy
            </Link>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-center text-[11.5px] text-slate-400">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              <path
                d="M7 1.75 11.5 3.5v3.1c0 2.55-1.75 4.8-4.5 5.65C4.25 11.4 2.5 9.15 2.5 6.6V3.5L7 1.75Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />

              <path
                d="m4.8 6.9 1.45 1.45L9.3 5.3"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            Securely processing your policy
          </div>

          <AutoRefresh />
        </div>
      </section>
    </PageShell>
  );
}

/* ─────────────────────────────────────────────────────────
   Main confirmed page
───────────────────────────────────────────────────────── */

export default async function SuccessPage(
  props: {
    searchParams?:
      | SuccessSearchParams
      | Promise<SuccessSearchParams>;
  }
) {
  const searchParams =
    await Promise.resolve(
      props.searchParams ?? {}
    );

  const checkoutId = (
    searchParams.checkout_id ?? ""
  ).trim();

  const legacyStripeSessionId = (
    searchParams.session_id ?? ""
  ).trim();

  let policy:
    | ConfirmedPolicy
    | null = null;

  if (checkoutId) {
    policy =
      await findSquarePolicy(
        checkoutId
      );
  } else if (
    legacyStripeSessionId
  ) {
    policy =
      await findLegacyStripePolicy(
        legacyStripeSessionId
      );
  }

  if (!policy) {
    return <ProcessingView />;
  }

  return (
    <PageShell
      hideHero
      crumbs={[
        {
          label: "Home",
          href: "/",
        },
        {
          label: "Covered",
        },
      ]}
    >
      {/* ══ HERO ══ */}
      <section className="pt-2 sm:pt-4 lg:pt-6">
        <div className="max-w-[76rem]">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Cover confirmed
          </div>

          <div className="relative mt-6 max-w-[70rem]">
            <div className="pointer-events-none absolute inset-x-0 top-[8%] -z-10 opacity-45 sm:top-[12%]">
              <svg
                viewBox="0 0 1200 260"
                className="h-[220px] w-full sm:h-[260px] lg:h-[300px]"
                fill="none"
                aria-hidden="true"
                preserveAspectRatio="none"
              >
                <path
                  d="M18 152C114 62 222 227 338 152C446 82 548 216 676 142C794 72 906 201 1026 132C1090 96 1142 105 1182 122"
                  stroke="rgba(16,185,129,0.12)"
                  strokeWidth="34"
                  strokeLinecap="round"
                />

                <path
                  d="M10 154C108 66 216 224 334 150C444 80 544 214 672 140C792 70 904 198 1024 130C1088 95 1140 103 1190 120"
                  stroke="rgba(16,185,129,0.24)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h1 className="heading-unbalanced relative max-w-[8ch] text-[3.25rem] font-extrabold leading-[0.9] tracking-[-0.07em] text-slate-950 sm:text-[4.55rem] lg:text-[5.85rem]">
              You&apos;re covered.
            </h1>
          </div>

          <p className="mt-8 max-w-[44rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
            Your policy is active. Documents sent to{" "}
            <span className="font-semibold text-slate-800">
              {policy.email}
            </span>
            .
          </p>

          <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-700">
            {[
              "Policy created",
              "Documents emailed",
              "Retrieval available anytime",
            ].map((item) => (
              <div
                key={item}
                className="inline-flex items-center gap-2"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 h-px w-full bg-[linear-gradient(90deg,rgba(226,232,240,0),rgba(226,232,240,0.95),rgba(226,232,240,0))]" />
        </div>
      </section>

      {/* ══ POLICY SECTION ══ */}
      <section className="mt-12">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
          <div className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(108,76,243,0.12)] bg-white px-8 py-8 shadow-[0_2px_24px_rgba(108,76,243,0.06)]">
              <div
                className="absolute bottom-6 left-0 top-6 w-1 rounded-full bg-[rgb(108,76,243)]"
                aria-hidden="true"
              />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    Policy number
                  </p>

                  <p className="mt-3 font-mono text-[2rem] font-extrabold leading-none tracking-[0.02em] text-slate-950 sm:text-[2.6rem]">
                    {policy.policyNumber}
                  </p>

                  <p className="mt-3 text-[12.5px] text-slate-400">
                    Save this — you&apos;ll need it to retrieve your
                    documents.
                  </p>
                </div>

                <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>

                  ACTIVE
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[1.5rem] border border-slate-100 bg-white px-6 py-5 shadow-[0_1px_12px_rgba(15,23,42,0.04)]">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.20em] text-slate-400">
                  Starts
                </p>

                <p className="mt-2 text-[14px] font-semibold leading-snug text-slate-950">
                  {fmt(policy.startAt)}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-100 bg-white px-6 py-5 shadow-[0_1px_12px_rgba(15,23,42,0.04)]">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.20em] text-slate-400">
                  Ends
                </p>

                <p className="mt-2 text-[14px] font-semibold leading-snug text-slate-950">
                  {fmt(policy.endAt)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-100 bg-white px-6 py-5 shadow-[0_1px_12px_rgba(15,23,42,0.04)]">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.20em] text-slate-400">
                  Vehicle
                </p>

                <p className="mt-2 text-[14px] font-semibold leading-snug text-slate-950">
                  {vehicleLine(policy)}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-100 bg-white px-6 py-5 shadow-[0_1px_12px_rgba(15,23,42,0.04)]">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.20em] text-slate-400">
                  Documents sent to
                </p>

                <p className="mt-2 break-all text-[14px] font-semibold leading-snug text-slate-950">
                  {policy.email}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-[0_1px_12px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-100 px-6 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[rgb(108,76,243)]">
                  Before you drive
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {[
                  {
                    number: "01",
                    title:
                      "Check your inbox",
                    description:
                      "Your certificate PDF is there now.",
                  },
                  {
                    number: "02",
                    title:
                      "Save to your phone",
                    description:
                      "Keep it accessible while driving.",
                  },
                  {
                    number: "03",
                    title:
                      "Legal proof of cover",
                    description:
                      "Show it if asked — it’s valid.",
                  },
                ].map(
                  ({
                    number,
                    title,
                    description,
                  }) => (
                    <div
                      key={number}
                      className="flex items-start gap-4 px-6 py-4"
                    >
                      <span className="mt-0.5 shrink-0 text-[11px] font-bold tabular-nums text-[rgb(108,76,243)]/40">
                        {number}
                      </span>

                      <div>
                        <p className="text-[13.5px] font-semibold text-slate-900">
                          {title}
                        </p>

                        <p className="text-[12px] text-slate-400">
                          {description}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="grid gap-2.5">
              <Link
                href="/retrieve-policy"
                className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[rgb(108,76,243)] px-8 text-[15px] font-semibold !text-white shadow-[0_12px_36px_rgba(108,76,243,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[rgb(96,66,225)] hover:shadow-[0_16px_44px_rgba(108,76,243,0.36)]"
              >
                Retrieve policy

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
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

              <Link
                href="/"
                className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-[15px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Back to home
              </Link>
            </div>

            <p className="text-center text-[12px] leading-[1.7] text-slate-400">
              MID records update several times daily — your cover is
              active now even if it hasn&apos;t appeared yet.
              Can&apos;t find the email?{" "}
              <Link
                href="/retrieve-policy"
                className="font-semibold text-[rgb(108,76,243)] underline-offset-4 hover:underline"
              >
                Retrieve your policy.
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ══ FOOTER CTA ══ */}
      <section className="mb-4 mt-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-[rgb(108,76,243)] px-8 py-10 shadow-[0_20px_56px_rgba(108,76,243,0.22)] sm:px-10 sm:py-12">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/[0.07]"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/[0.05]"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-[640px] text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">
              Always available
            </p>

            <h2 className="mt-2 text-[1.7rem] font-extrabold leading-[0.98] tracking-[-0.045em] !text-white sm:text-[2.2rem]">
              Need your documents later?
            </h2>

            <p className="mt-3 text-[0.92rem] leading-[1.75] text-white/70">
              Retrieve your policy and download your documents again
              at any time — no need to contact us.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/retrieve-policy"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-white px-7 text-[14.5px] font-semibold text-[rgb(108,76,243)] transition hover:bg-white/90 sm:w-auto"
              >
                Retrieve policy
              </Link>

              <Link
                href="/help-support"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-white/25 px-7 text-[14.5px] font-semibold !text-white transition hover:bg-white/10 sm:w-auto"
              >
                Help &amp; support
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}