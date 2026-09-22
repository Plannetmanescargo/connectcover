"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import s from "./documents.module.css";
import CoverzaHeader from "./views/Header";
import CoverzaFooter from "./views/Footer";
// One shared brand and navigation across public pages and the vehicle journey.
export function SiteHeader() {
  return <CoverzaHeader />;
}
export function SiteFooter() {
  return <CoverzaFooter />;
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
        We remember your cookie preference in this browser.{" "}
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
  return <DocumentCookies />;
}
