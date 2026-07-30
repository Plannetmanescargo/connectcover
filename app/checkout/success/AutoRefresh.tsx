"use client";

import { useEffect, useRef } from "react";

export default function AutoRefresh() {
  const tries = useRef(0);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      tries.current += 1;

      if (tries.current <= 40) {
        window.location.reload();
      }
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return null;
}