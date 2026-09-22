"use client";
import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import CookieBanner from "@/components/site/CookieBanner";
import s from "./documents.module.css";
import CoverzaHeader from "./views/Header";
import CoverzaFooter from "./views/Footer";
// Explicit allowlist keeps shared chrome unchanged on quote, checkout and retrieval routes.
const documentRoutes = [
  "/",
  "/car",
  "/van",
  "/learner",
  "/impound",
  "/help-support",
  "/support",
  "/contact",
  "/more",
  "/more/faq",
  "/more/guides",
  "/more/blog",
  "/privacy",
  "/terms",
  "/cookies",
  "/complaints",
];
function useDocumentRoute() {
  const path = usePathname();
  return documentRoutes.includes(path);
}
export function SiteHeader() {
  const isDocument = useDocumentRoute();
  return isDocument ? (
    <>
      <CoverzaHeader />
      <div className="border-b border-violet-100 bg-violet-50 px-5 py-2 text-center text-xs leading-5 text-violet-900">
        Design preview · The vehicle journey continues to show the existing
        service.
      </div>
    </>
  ) : (
    <Header />
  );
}
export function SiteFooter() {
  const isDocument = useDocumentRoute();
  return isDocument ? <CoverzaFooter /> : <Footer />;
}
function subscribeToChoice(listener: () => void) {
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}
function hasSavedChoice() {
  try {
    return ["accepted", "rejected"].includes(
      localStorage.getItem("Coverza_cookie_choice") || "",
    );
  } catch {
    return false;
  }
}
function DocumentCookies() {
  const saved = useSyncExternalStore(
    subscribeToChoice,
    hasSavedChoice,
    () => true,
  );
  const [dismissed, setDismissed] = useState(false);
  function choose(choice: string) {
    try {
      localStorage.setItem("Coverza_cookie_choice", choice);
    } catch {}
    setDismissed(true);
  }
  if (saved || dismissed) return null;
  return (
    <aside
      className={`${s.surface} ${s.cookie}`}
      aria-label="Cookie preferences"
    >
      <p>
        This preview remembers your cookie preference in this browser. No
        optional analytics are added by this refresh.{" "}
        <Link href="/cookies">About cookies</Link>.
      </p>
      <div className={s.actions}>
        <button className={s.secondary} onClick={() => choose("rejected")}>
          Reject optional
        </button>
        <button className={s.button} onClick={() => choose("accepted")}>
          Accept optional
        </button>
      </div>
    </aside>
  );
}
export function SiteCookies() {
  const isDocument = useDocumentRoute();
  return isDocument ? <DocumentCookies /> : <CookieBanner />;
}
