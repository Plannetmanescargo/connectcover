"use client";

import { Analytics } from "@vercel/analytics/next";

export default function WebAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        try {
          if (localStorage.getItem("Coverza_cookie_choice") === "rejected") {
            return null;
          }
        } catch {}
        try {
          const url = new URL(event.url);
          // Keep registrations, payment identifiers and bypass tokens out of analytics.
          url.search = "";
          url.hash = "";
          return { ...event, url: url.toString() };
        } catch {
          return null;
        }
      }}
    />
  );
}
