"use client";

import { useEffect } from "react";

export default function WorldpayConfirmation({ checkoutId }: { checkoutId: string }) {
  useEffect(() => {
    if (!checkoutId) return;
    let stopped = false;
    let busy = false;
    let confirmed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    const started = Date.now();

    async function check() {
      if (stopped || busy || confirmed) return;
      if (timer) clearTimeout(timer);
      if (document.visibilityState === "hidden") return;
      busy = true;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 8000);
      try {
        const response = await fetch(`/api/worldpay/status?checkout_id=${encodeURIComponent(checkoutId)}`, {
          cache: "no-store", signal: controller.signal,
        });
        if (response.ok && (await response.json()).confirmed === true && !stopped) {
          confirmed = true;
          // A full navigation avoids retaining an old server-component view.
          window.location.reload();
        }
      } catch {
        // Temporary network failures must not permanently stop confirmation checks.
      } finally {
        clearTimeout(timeout);
        busy = false;
        if (!stopped && !confirmed) {
          timer = setTimeout(check, Date.now() - started < 120_000 ? 1000 : 5000);
        }
      }
    }
    const resume = () => { void check(); };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume);
    window.addEventListener("online", resume);
    void check();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("focus", resume);
      window.removeEventListener("online", resume);
    };
  }, [checkoutId]);

  return <button type="button" className="mt-6 block mx-auto underline" onClick={() => window.location.reload()}>
    Check payment status now
  </button>;
}
