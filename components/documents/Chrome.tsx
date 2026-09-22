"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import CookieBanner from "@/components/site/CookieBanner";
import s from "./documents.module.css";
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
const links = [
  ["/car", "Car"],
  ["/van", "Van"],
  ["/learner", "Learner"],
  ["/impound", "Collection"],
  ["/more", "Resources"],
  ["/help-support", "Help"],
];
function useDocumentRoute() {
  const path = usePathname();
  return documentRoutes.includes(path);
}
function Brand() {
  return (
    <Link className={s.brand} href="/" aria-label="Coverza home">
      Coverza<span>.</span>
    </Link>
  );
}
function DocumentHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const resize = () => {
      if (window.innerWidth > 760) setOpen(false);
    };
    window.addEventListener("keydown", close);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("keydown", close);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <header className={`${s.surface} ${s.header}`}>
      <div className={`${s.wrap} ${s.nav}`}>
        <Brand />
        <nav className={s.navLinks} aria-label="Main navigation">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
          <Link href="/contact" className={s.button}>
            Discuss a document ↗
          </Link>
        </nav>
        <button
          ref={button}
          className={s.menuButton}
          aria-expanded={open}
          aria-controls="document-menu"
          onClick={() => setOpen(!open)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <nav
          id="document-menu"
          aria-label="Mobile navigation"
          className={s.mobileNav}
        >
          {[...links, ["/contact", "Discuss a document"]].map(
            ([href, label]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={path === href ? "page" : undefined}
              >
                {label}
              </Link>
            ),
          )}
        </nav>
      )}
    </header>
  );
}
export function SiteHeader() {
  const isDocument = useDocumentRoute();
  return isDocument ? (
    <>
      <DocumentHeader />
      <div className={`${s.surface} ${s.notice}`}>
        Document service preview · Online ordering for these services is not
        enabled.
      </div>
    </>
  ) : (
    <Header />
  );
}
export function SiteFooter() {
  const isDocument = useDocumentRoute();
  if (!isDocument) return <Footer />;
  return (
    <footer className={`${s.surface} ${s.footer}`}>
      <div className={s.wrap}>
        <div className={s.footerGrid}>
          <div>
            <Brand />
            <p>
              Automotive documentation, technical guidance and supporting
              digital resources. Defined by your requirements. Delivered
              electronically.
            </p>
            <p>
              Documents describe the agreed service; they do not provide motor
              insurance or permission to drive.
            </p>
          </div>
          <div>
            <h2>Explore</h2>
            {links.slice(0, 5).map(([href, label]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </div>
          <div>
            <h2>Here to help</h2>
            {[
              ["/help-support", "Help centre"],
              ["/contact", "Contact"],
              ["/complaints", "Feedback & complaints"],
              ["/privacy", "Privacy"],
              ["/terms", "Terms"],
              ["/cookies", "Cookies"],
            ].map(([href, label]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className={s.footerBottom}>
          © {new Date().getFullYear()} Coverza · Exact deliverables depend on
          the order and applicable service description.
        </div>
      </div>
    </footer>
  );
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
