"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function MollieConfirmation({ checkoutId }: { checkoutId: string }) {
  const [state, setState] = useState("PENDING");
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    async function check() {
      if (stopped || !checkoutId) return;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 8000);
      let terminal = false;
      try {
        const response = await fetch(`/api/mollie/status?checkout_id=${encodeURIComponent(checkoutId)}`, { cache: "no-store", signal: controller.signal });
        if (response.status === 404 || response.status === 400) { setState("UNKNOWN"); terminal = true; }
        if (response.ok) {
          const result = await response.json();
          if (!stopped && result.confirmed && !result.needsReview) { window.location.reload(); terminal = true; }
          else if (!stopped) {
            setState(result.needsReview ? "REVIEW" : result.status || "PENDING");
            terminal = result.needsReview || ["FAILED", "EXPIRED"].includes(result.status);
          }
        }
      } catch { /* transient network errors can be retried */ }
      finally {
        clearTimeout(timeout);
        if (!stopped && !terminal) timer = setTimeout(check, 3000);
      }
    }
    void check();
    return () => { stopped = true; if (timer) clearTimeout(timer); controller?.abort(); };
  }, [checkoutId]);
  const ended = state === "FAILED" || state === "EXPIRED";
  const review = state === "REVIEW" || state === "UNKNOWN" || !checkoutId;
  return <section className="mx-auto max-w-xl px-6 py-16 text-center">
    <h1 className="text-3xl font-bold">{review ? "Please contact support" : ended ? "Payment was not completed" : state === "PAID" ? "Payment received" : "Checking your payment"}</h1>
    <p className="mt-5 text-slate-600">{review ? "We need to check this payment. Please contact support before paying again." : ended ? "Your payment was canceled, failed or expired. You can return to your quote to try again." : state === "PAID" ? "We’re preparing your documents. This page will update when they’re ready." : "We’re waiting for confirmation from Mollie. This page checks automatically. Please don’t pay again while confirmation is pending."}</p>
    {ended && <Link className="btn-primary mt-6" href="/get-quote">Return to quote</Link>}
    <Link className="mt-6 block underline" href="/help-support">Contact support</Link>
  </section>;
}
