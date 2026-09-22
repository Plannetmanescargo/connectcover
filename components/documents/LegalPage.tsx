import Link from "next/link";
import PageShell from "@/components/site/PageShell";
import { terms, privacy } from "@/content/documents/legal";
export default function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const items = kind === "terms" ? terms : privacy;
  return (
    <PageShell
      hideHero
      crumbs={[
        { label: "Home", href: "/" },
        { label: kind === "terms" ? "Terms" : "Privacy" },
      ]}
    >
      <section className="pt-4">
        <div className="badge text-[rgb(108,76,243)]">
          Document service · Review draft
        </div>
        <h1 className="mt-6 max-w-[16ch] text-[3.25rem] font-extrabold leading-[.95] tracking-[-.06em] text-slate-950 sm:text-[4.55rem] lg:text-[5.5rem]">
          {kind === "terms"
            ? "Clear terms. Considered details."
            : "Your information. Handled with clarity."}
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-8 text-slate-600">
          Read the document-service draft below. Operating details and final
          service arrangements need confirmation before launch.
        </p>
      </section>
      <div className="mt-12 grid items-start gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-[1.5rem] border border-slate-200 bg-white p-6 lg:sticky lg:top-28">
          <h2 className="text-sm font-semibold text-slate-900">On this page</h2>
          <nav aria-label="Document sections" className="mt-4 grid gap-1">
            {items.map((x, i) => (
              <a
                key={x.title}
                href={`#section-${i}`}
                className="py-2 text-sm leading-6 text-slate-600 hover:text-[rgb(108,76,243)]"
              >
                {x.title}
              </a>
            ))}
          </nav>
          <p className="mt-6 border-t border-slate-200 pt-5 text-xs leading-6 text-slate-500">
            Using an existing service?{" "}
            <Link
              className="underline underline-offset-4"
              href={`/existing-service/${kind}`}
            >
              Read the existing {kind === "terms" ? "terms" : "privacy notice"}
            </Link>
            .
          </p>
        </aside>
        <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white px-6 shadow-sm sm:px-10">
          {items.map((x, i) => (
            <section
              key={x.title}
              id={`section-${i}`}
              className="scroll-mt-28 border-b border-slate-100 py-8 last:border-0"
            >
              <h2 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                {x.title}
              </h2>
              {x.paragraphs.map((p) => (
                <p
                  key={p}
                  className="mt-4 text-sm leading-8 text-slate-600 sm:text-base"
                >
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
