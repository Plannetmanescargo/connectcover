"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresh() {
  const router = useRouter();
  const tries = useRef(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      tries.current += 1;

      /*
       * Check every 3 seconds for up to 2 minutes.
       */
      if (tries.current > 40) {
        window.clearInterval(intervalId);
        return;
      }

      /*
       * Re-run the server component without performing
       * a complete browser-page reload.
       */
      router.refresh();
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [router]);

  return null;
}