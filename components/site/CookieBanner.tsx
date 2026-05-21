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
    <div className="fixed inset-x-0 bottom-0 z-[90] px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-6 sm:pb-6">
      <div
        role="dialog"
        aria-live="polite"
        aria-label="Cookie preferences"
        className="mx-auto max-w-4xl rounded-[1.7rem] border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-[48rem]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(108,76,243)]">
              Cookies
            </div>

            <div className="mt-2 text-[1.05rem] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[1.15rem]">
              We use cookies to improve your experience
            </div>

            <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-[0.97rem]">
              We use cookies to keep the site working, understand usage, and improve
              your experience. You can accept all or reject all. Read our{" "}
              <Link
                href="/privacy-policy"
                className="font-semibold text-slate-900 underline underline-offset-2"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
<button
  type="button"
  onClick={() => saveChoice("rejected")}
  className="btn-ghost w-full sm:w-auto"
>
  Reject all
</button>

<button
  type="button"
  onClick={() => saveChoice("accepted")}
  className="btn-primary w-full sm:w-auto !text-white"
>
  Accept all
</button>
          </div>
        </div>
      </div>
    </div>
  );
}