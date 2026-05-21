import Link from "next/link";

type Crumb = { label: string; href?: string };

type CtaVariant = "ghost" | "primary";

export default function PageShell({
  eyebrow,
  title,
  subtitle,
  crumbs,
  children,
  ctaLabel,
  ctaHref,
  ctaVariant = "ghost",
  hideHero = false,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  crumbs?: Crumb[];
  children?: React.ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
  ctaVariant?: CtaVariant;
  hideHero?: boolean;
}) {
  const ctaClass = ctaVariant === "primary" ? "btn-primary" : "btn-ghost";

  return (
    <div className="container-app py-10 sm:py-12">
      {crumbs?.length ? (
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex flex-wrap items-center gap-2 text-[12px]">
            {crumbs.map((c, idx) => {
              const isLast = idx === crumbs.length - 1;

              return (
                <li key={`${c.label}-${idx}`} className="flex items-center gap-2">
                  {c.href && !isLast ? (
                    <Link
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
                      href={c.href}
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-900">
                      {c.label}
                    </span>
                  )}

                  {!isLast ? <span className="text-slate-300">/</span> : null}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      {!hideHero ? (
        <div className="card-soft p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl min-w-0">
              {eyebrow ? (
                <div className="badge mb-4">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  <span className="font-extrabold">{eyebrow}</span>
                </div>
              ) : null}

              {title ? (
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  {title}
                </h1>
              ) : null}

              {subtitle ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {ctaLabel && ctaHref ? (
              <Link className={`${ctaClass} w-full sm:w-auto`} href={ctaHref}>
                {ctaLabel}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {children ? <div className={hideHero ? "" : "mt-6"}>{children}</div> : null}
    </div>
  );
}