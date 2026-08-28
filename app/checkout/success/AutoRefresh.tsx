"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresh() {
  const router = useRouter();
  const tries = useRef(0);

  useEffect(() => {
    let timeoutId: number | undefined;
    let cancelled = false;

    const refresh = () => {
      if (cancelled) return;

      tries.current += 1;

      /*
       * Stop after roughly 2 minutes.
       */
      if (tries.current > 70) {
        return;
      }

      /*
       * Re-run the server component without doing
       * a complete browser-page reload.
       */
      router.refresh();

      /*
       * Fast polling immediately after payment,
       * then progressively back off.
       *
       *  1–15  = every 800ms
       * 16–35  = every 1.5s
       * 36+    = every 3s
       */
      let delay = 3000;

      if (tries.current <= 15) {
        delay = 800;
      } else if (tries.current <= 35) {
        delay = 1500;
      }

      timeoutId = window.setTimeout(
        refresh,
        delay
      );
    };

    /*
     * Don't make the customer wait 3 seconds
     * for the first retry.
     */
    timeoutId = window.setTimeout(
      refresh,
      500
    );

    return () => {
      cancelled = true;

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [router]);

  return null;
}