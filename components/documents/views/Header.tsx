"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const RESOURCE_NAV = [
  { href: "/car", label: "Car documents" },
  { href: "/van", label: "Van documents" },
  { href: "/learner", label: "Learner documents" },
  { href: "/impound", label: "Collection documents" },
];

const MAIN_NAV = [
  { href: "/more/guides", label: "Guides" },
  { href: "/more/faq", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

const HELP_NAV = [
  { href: "/help-support", label: "Help & Support" },
  { href: "/retrieve-policy", label: "Retrieve policy" },
  { href: "/more/blog", label: "Blog" },
];

const DESKTOP_GROUPS = [
  { id: "resources", label: "Resources", items: RESOURCE_NAV },
  { id: "help", label: "Help", items: HELP_NAV },
] as const;

type Dropdown = (typeof DESKTOP_GROUPS)[number]["id"];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<Dropdown | null>(null);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  const closeMenus = () => {
    setOpen(false);
    setActiveDropdown(null);
    setMobileResourcesOpen(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (activeDropdown) {
        navRef.current
          ?.querySelector<HTMLButtonElement>(`#${activeDropdown}-trigger`)
          ?.focus();
      } else if (open) {
        menuButtonRef.current?.focus();
      }
      setOpen(false);
      setActiveDropdown(null);
      setMobileResourcesOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.target instanceof Node && !navRef.current?.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [activeDropdown, open]);

  useEffect(() => {
    if (!open) return;
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
    };
  }, [open]);

  useEffect(() => {
    // Match Tailwind's default xl breakpoint and release mobile scroll lock.
    const desktop = window.matchMedia("(min-width: 1280px)");
    const onBreakpointChange = () => {
      setOpen(false);
      setActiveDropdown(null);
      setMobileResourcesOpen(false);
    };
    desktop.addEventListener("change", onBreakpointChange);
    return () => desktop.removeEventListener("change", onBreakpointChange);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="container-app">
        <div className="flex h-[76px] items-center justify-between gap-6 xl:gap-8">
          <div className="flex min-w-0 flex-1 items-center gap-8 xl:gap-12">
            <Link
              href="/"
              onClick={closeMenus}
              aria-label="Coverza"
              className="flex shrink-0 items-center gap-3.5 rounded-xl transition-opacity hover:opacity-95"
            >
              <Image
                src="/brand/connectcoverbig.png"
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

            <nav ref={navRef} className="hidden flex-1 items-center justify-center gap-7 xl:flex" aria-label="Primary navigation">
              {DESKTOP_GROUPS.map((group) => {
                const expanded = activeDropdown === group.id;
                return (
                  <div
                    key={group.id}
                    className="relative"
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        setActiveDropdown((current) => current === group.id ? null : current);
                      }
                    }}
                  >
                    <button
                      id={`${group.id}-trigger`}
                      type="button"
                      onClick={() => setActiveDropdown(expanded ? null : group.id)}
                      aria-expanded={expanded}
                      aria-controls={`${group.id}-links`}
                      className="group relative inline-flex items-center gap-2 whitespace-nowrap py-2 text-[0.96rem] font-medium text-slate-700 transition-colors duration-200 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgb(108,76,243)]"
                    >
                      {group.label}
                      <span className={`text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} aria-hidden="true">▾</span>
                      <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[rgb(108,76,243)] transition-transform duration-300 group-hover:scale-x-100" />
                    </button>
                    <div id={`${group.id}-links`} hidden={!expanded} className="absolute left-0 top-full z-50 w-[260px] pt-3">
                      <div className="rounded-[1.3rem] border border-slate-200/80 bg-white/96 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                        <div className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{group.label}</div>
                        <div className="grid gap-1">
                          {group.items.map((item) => (
                            <Link key={item.href} href={item.href} onClick={closeMenus} className="rounded-xl px-3 py-3 text-[0.94rem] font-medium text-slate-800 transition hover:bg-slate-50 focus-visible:bg-slate-50">
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {MAIN_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenus}
                  className="group relative whitespace-nowrap py-2 text-[0.96rem] font-medium text-slate-700 transition-colors duration-200 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgb(108,76,243)]"
                >
                  {item.label}
                  <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[rgb(108,76,243)] transition-transform duration-300 group-hover:scale-x-100" />
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link href="/get-quote" onClick={closeMenus} className="btn-primary hidden sm:inline-flex">Find Vehicle</Link>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => {
                setOpen((previous) => !previous);
                setActiveDropdown(null);
                setMobileResourcesOpen(false);
              }}
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
        <nav id="mobile-menu" aria-label="Mobile navigation" className="absolute left-0 right-0 top-full z-[60] max-h-[calc(100dvh-76px)] overflow-y-auto overscroll-contain border-t border-slate-200/80 bg-white/96 backdrop-blur-xl xl:hidden">
          <div className="container-app py-4 pb-6">
            <div className="card-soft flex flex-col gap-2 p-3">
              <div className="rounded-[1rem] border border-slate-200/80 bg-white/80 p-2">
                <button
                  type="button"
                  onClick={() => setMobileResourcesOpen((previous) => !previous)}
                  aria-expanded={mobileResourcesOpen}
                  aria-controls="mobile-resource-links"
                  className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-3 text-[0.97rem] font-medium text-slate-800 transition hover:bg-slate-50"
                >
                  Resources
                  <span aria-hidden="true" className={`text-slate-400 transition-transform duration-200 ${mobileResourcesOpen ? "rotate-180" : ""}`}>▾</span>
                </button>
                <div id="mobile-resource-links" hidden={!mobileResourcesOpen}>
                  <div className="mt-1 grid gap-1 border-t border-slate-200/70 pt-2">
                    {RESOURCE_NAV.map((item) => (
                      <Link key={item.href} href={item.href} onClick={closeMenus} className="rounded-xl px-3 py-3 text-[0.95rem] font-medium text-slate-800 transition hover:bg-slate-50">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-1">
                {MAIN_NAV.map((item) => (
                  <Link key={item.href} href={item.href} onClick={closeMenus} className="rounded-xl px-3 py-3 text-[0.95rem] font-medium text-slate-800 transition hover:bg-slate-50">
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="mt-2 rounded-[1rem] border border-slate-200/80 bg-white/80 p-2">
                <div className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Help</div>
                <div className="grid gap-1">
                  {HELP_NAV.map((item) => (
                    <Link key={item.href} href={item.href} onClick={closeMenus} className="rounded-xl px-3 py-3 text-[0.95rem] font-medium text-slate-800 transition hover:bg-slate-50">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="pt-2">
                <Link href="/get-quote" onClick={closeMenus} className="btn-primary btn-primary-block">Find Vehicle</Link>
              </div>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}