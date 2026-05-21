"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const NAV = [
  { href: "/car", label: "Car insurance" },
  { href: "/van", label: "Van insurance" },
  { href: "/learner", label: "Learner insurance" },
  { href: "/impound", label: "Impound insurance" },
];

const HELP_NAV = [
  { href: "/help-support", label: "Help & Support" },
  { href: "/retrieve-policy", label: "Retrieve policy" },
  { href: "/more/faq", label: "FAQs" },
  { href: "/more/guides", label: "Guides" },
  { href: "/more/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setHelpOpen(false);
      }
    };

    const onClick = (e: MouseEvent) => {
      if (!helpRef.current) return;
      if (!helpRef.current.contains(e.target as Node)) {
        setHelpOpen(false);
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 relative border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="container-app">
        <div className="flex h-[76px] items-center gap-6 xl:gap-8">
          <div className="flex min-w-0 items-center gap-8">
            <Link
              href="/"
              aria-label="Coverza"
              className="flex shrink-0 items-center gap-3.5 rounded-xl transition-opacity hover:opacity-95"
            >
              <Image
                src="/brand/Connectcoverbig.png"
                alt=""
                width={42}
                height={42}
                priority
                className="h-[23px] w-[23px] object-contain sm:h-[25px] sm:w-[25px]"
              />

              <div className="flex items-baseline leading-none">
                <span className="text-[1.1rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[1.2rem] lg:text-[1.25rem]">
                  Coverza
                </span>
                <span
                  aria-hidden="true"
                  className="ml-[2px] text-[1.1rem] font-semibold leading-none text-[rgb(255,92,92)] sm:text-[1.2rem] lg:text-[1.25rem]"
                >
                  .
                </span>
              </div>
            </Link>

            <nav
              className="hidden items-center gap-5 xl:flex"
              aria-label="Primary navigation"
            >
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative whitespace-nowrap text-[0.96rem] font-medium text-slate-700 transition-colors duration-200 hover:text-slate-950"
                >
                  {item.label}
                  <span className="absolute inset-x-0 -bottom-2 h-px origin-left scale-x-0 bg-[rgb(108,76,243)] transition-transform duration-300 group-hover:scale-x-100" />
                </Link>
              ))}

              <div
                ref={helpRef}
                className="relative"
                onMouseEnter={() => setHelpOpen(true)}
                onMouseLeave={() => setHelpOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setHelpOpen((prev) => !prev)}
                  aria-expanded={helpOpen}
                  className="group relative inline-flex items-center gap-2 whitespace-nowrap text-[0.96rem] font-medium text-slate-700 transition-colors duration-200 hover:text-slate-950"
                >
                  Help
                  <span
                    className={[
                      "text-slate-400 transition-transform duration-200",
                      helpOpen ? "rotate-180" : "",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                  <span className="absolute inset-x-0 -bottom-2 h-px origin-left scale-x-0 bg-[rgb(108,76,243)] transition-transform duration-300 group-hover:scale-x-100" />
                </button>

                {helpOpen ? (
                  <div className="absolute left-0 top-full z-50 w-[260px]">
                    <div className="h-4" aria-hidden="true" />

                    <div className="rounded-[1.3rem] border border-slate-200/80 bg-white/96 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                      <div className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Help
                      </div>

                      <div className="grid gap-1">
                        {HELP_NAV.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setHelpOpen(false)}
                            className="rounded-xl px-3 py-3 text-[0.94rem] font-medium text-slate-800 transition hover:bg-slate-50"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link href="/get-quote" className="btn-primary hidden sm:inline-flex">
              Get covered
            </Link>

            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 xl:hidden"
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="absolute left-0 right-0 top-full z-[60] max-h-[calc(100vh-76px)] overflow-y-auto overscroll-contain border-t border-slate-200/80 bg-white/96 backdrop-blur-xl xl:hidden"
        >
          <div className="container-app py-4 pb-6">
            <div className="card-soft flex flex-col gap-2 p-3">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-[0.97rem] font-medium text-slate-800 transition hover:bg-slate-50"
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-2 rounded-[1rem] border border-slate-200/80 bg-white/80 p-2">
                <div className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Help
                </div>

                <div className="grid gap-1">
                  {HELP_NAV.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setHelpOpen(false);
                        setOpen(false);
                      }}
                      className="rounded-xl px-3 py-3 text-[0.95rem] font-medium text-slate-800 transition hover:bg-slate-50"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/get-quote"
                  onClick={() => setOpen(false)}
                  className="btn-primary btn-primary-block"
                >
                  Get covered
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}