"use client";
import { useEffect, useState } from "react";
import StripeProgress from "./StripeProgress";
import styles from "../paypal/checkout.module.css";
import Link from "next/link";

export default function StripeConfirmation({ checkoutId }: { checkoutId: string }) {
  const [documentsReady, setDocumentsReady] = useState(false);
  const [delayed, setDelayed] = useState(false);
  const [state, setState] = useState("PENDING");
  useEffect(() => {
    let stopped = false;
    const started = Date.now();
    const delayNotice = setTimeout(() => setDelayed(true), 20000);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    async function check() {
      if (stopped || !checkoutId) return;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 8000);
      let terminal = false;
      try {
        const response = await fetch(`/api/stripe/status?checkout_id=${encodeURIComponent(checkoutId)}`, { cache: "no-store", signal: controller.signal });
        if (response.status === 404 || response.status === 400) { setState("UNKNOWN"); terminal = true; }
        if (response.ok) {
          const result = await response.json();
          if (!stopped) setDocumentsReady(Boolean(result.documentsReady));
          if (!stopped && result.confirmed && !result.needsReview) { window.location.reload(); terminal = true; }
          else if (!stopped) {
            setState(result.needsReview ? "REVIEW" : result.status || "PENDING");
            terminal = result.needsReview || ["FAILED", "EXPIRED"].includes(result.status);
          }
        }
      } catch { /* transient network errors can be retried */ }
      finally {
        clearTimeout(timeout);
        if (!stopped && !terminal) timer = setTimeout(check, Date.now() - started < 30000 ? 1000 : 3000);
      }
    }
    void check();
    return () => { stopped = true; clearTimeout(delayNotice); if (timer) clearTimeout(timer); controller?.abort(); };
  }, [checkoutId]);
  const ended = state === "FAILED" || state === "EXPIRED";
  const review = state === "REVIEW" || state === "UNKNOWN" || !checkoutId;
  if (!ended && !review) return <>
    <StripeProgress state={state} documentsReady={documentsReady} delayed={delayed} />
    <div className={styles.support}><Link href="/help-support">Need a hand? Contact support</Link>{delayed && <small>Checkout reference: {checkoutId}</small>}</div>
  </>;
  return <section className={styles.progress}>
    <p className={styles.eyebrow}>YOUR COVERZA PURCHASE</p>
    <h1 className={styles.progressTitle}>{review ? "Let’s check your payment." : "Payment wasn’t completed."}</h1>
    <p className={styles.progressIntro}>{review ? "Please contact support before paying again so we can check your purchase." : "Your payment was cancelled, failed or expired. You can return to your purchase to try again."}</p>
    {ended && <Link className="btn-primary mt-6" href="/get-quote">Return to purchase</Link>}
    <Link className="mt-6 block underline" href="/help-support">Contact support</Link>
  </section>;
}
