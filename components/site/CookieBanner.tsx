"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CookieChoice = "accepted" | "rejected" | null;

const STORAGE_KEY = "Coverza_cookie_choice";

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [choice, setChoice] = useState<CookieChoice>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as CookieChoice;

    if (saved === "accepted" || saved === "rejected") {
      setChoice(saved);
    }

    setMounted(true);
  }, []);

  function saveChoice(next: Exclude<CookieChoice, null>) {
    window.localStorage.setItem(STORAGE_KEY, next);
    setChoice(next);
  }

  if (!mounted || choice) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] px-3 pb-[calc(env(safe-area-inset-bottom)+0.9rem)] sm:px-6 sm:pb-6">
      <div
        role="dialog"
        aria-live="polite"
        aria-label="Cookie preferences"
        className="mx-auto max-w-5xl overflow-hidden rounded-[1.45rem] border border-[rgba(var(--border),0.85)] bg-white/88 shadow-[0_24px_80px_rgba(17,24,31,0.14)] backdrop-blur-2xl"
      >
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(var(--brand),0.45)] to-transparent" />

          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
            <div className="flex gap-3 sm:gap-4">
              <div className="mt-0.5 hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[rgba(var(--brand),0.14)] bg-[rgb(var(--brand-soft))] text-[rgb(var(--brand-dark))] shadow-[0_10px_28px_rgba(108,76,243,0.12)] sm:flex">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                >
                  <path
                    d="M8.75 7.75h.01M14.75 6.75h.01M15.75 13.25h.01M9.75 15.75h.01M12 21a9 9 0 1 1 8.96-9.85 1.45 1.45 0 0 1-1.75 1.54 2.1 2.1 0 0 0-2.38 2.77 1.55 1.55 0 0 1-1.15 2.04 2.05 2.05 0 0 0-1.56 2.43A1.46 1.46 0 0 1 12.67 21H12Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[rgb(var(--brand-dark))]">
                  Cookies
                </div>

                <h2 className="mt-1 text-[1.05rem] font-semibold tracking-[-0.035em] text-[rgb(var(--text))] sm:text-[1.2rem]">
                  A smoother experience.
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--text-muted))] sm:text-[0.96rem] sm:leading-7">
                  We use essential cookies to keep Coverza working, including
                  quote, checkout, policy retrieval and security features.
                  Optional cookies help us understand how the site is used and
                  improve the temporary car insurance experience. You can accept
                  or reject optional cookies at any time. Read our{" "}
                  <Link
                    href="/privacy"
                    className="font-semibold text-[rgb(var(--text))] underline decoration-[rgba(var(--brand),0.35)] underline-offset-4 transition hover:decoration-[rgba(var(--brand),0.75)]"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
              <button
                type="button"
                onClick={() => saveChoice("rejected")}
                className="btn-ghost min-w-[8.5rem] !bg-white/70"
              >
                Reject
              </button>

              <button
                type="button"
                onClick={() => saveChoice("accepted")}
                className="btn-primary min-w-[8.5rem] !text-white"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}