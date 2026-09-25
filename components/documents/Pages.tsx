import type { Metadata } from "next";
import Link from "next/link";
import s from "./documents.module.css";
export { s };
export function documentMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    keywords: ["Coverza", "vehicle documents", "technical guidance"],
    category: "Automotive documentation",
    alternates: { canonical: `https://www.coverza.net${path}` },
    robots: { index: false, follow: false },
    openGraph: {
      title: `${title} | Coverza`,
      description,
      url: `https://www.coverza.net${path}`,
      type: "website",
      images: [],
    },
    twitter: {
      card: "summary",
      title: `${title} | Coverza`,
      description,
      images: [],
    },
  };
}
export function Action({
  href = "/contact",
  children = "Discuss your requirements",
  secondary = false,
}: {
  href?: string;
  children?: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link href={href} className={secondary ? s.secondary : s.button}>
      {children}
      <span aria-hidden="true">↗</span>
    </Link>
  );
}
export function DocumentIllustration() {
  return (
    <div
      className={s.paper}
      aria-label="Illustrative document contents, not a customer document"
    >
      <div className={s.paperTop}>
        <span>
          Coverza<span aria-hidden="true">.</span>
        </span>
        <span>DOCUMENT OVERVIEW</span>
      </div>
      <h2>
        The detail.
        <br />
        Clearly documented.
      </h2>
      {[
        "Vehicle & service scope",
        "Compatibility & prerequisites",
        "Guidance & reference notes",
        "Agreed delivery & revisions",
      ].map((x, i) => (
        <div className={s.paperRow} key={x}>
          <span>0{i + 1}</span>
          <div>{x}</div>
        </div>
      ))}
      <div className={s.paperStamp}>
        Illustrative contents · tailored to the agreed service
      </div>
    </div>
  );
}
export function Page({
  eyebrow,
  title,
  intro,
  children,
  illustration = false,
  cta = false,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children?: React.ReactNode;
  illustration?: boolean;
  cta?: boolean;
}) {
  return (
    <div className={s.surface}>
      <section className={s.hero}>
        <div className={`${s.wrap} ${illustration ? s.heroGrid : ""}`}>
          <div>
            <p className={s.eyebrow}>{eyebrow}</p>
            <h1>{title}</h1>
            <p className={s.intro}>{intro}</p>
            {cta && (
              <div className={s.actions}>
                <Action />
                <Action href="/more/guides" secondary>
                  Explore the guides
                </Action>
              </div>
            )}
          </div>
          {illustration && <DocumentIllustration />}
        </div>
      </section>
      {children}
    </div>
  );
}
export function Section({
  eyebrow,
  title,
  intro,
  children,
  id,
}: {
  eyebrow?: string;
  title?: string;
  intro?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section className={s.section} id={id}>
      <div className={s.wrap}>
        {title && (
          <div className={s.sectionHead}>
            <div>
              {eyebrow && <p className={s.eyebrow}>{eyebrow}</p>}
              <h2>{title}</h2>
            </div>
            {intro && <p>{intro}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
export type CardData = {
  title: string;
  text: string;
  href?: string;
  label?: string;
};
export function Cards({
  items,
  four = false,
}: {
  items: CardData[];
  four?: boolean;
}) {
  return (
    <div className={`${s.grid} ${four ? s.four : ""}`}>
      {items.map((item, i) => (
        <article className={s.card} key={item.title}>
          <span className={s.number}>0{i + 1}</span>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
          {item.href && (
            <Link href={item.href}>
              {item.label || "Explore documents"}
              <span aria-hidden="true">&nbsp;↗</span>
            </Link>
          )}
        </article>
      ))}
    </div>
  );
}
export type Question = { q: string; a: string };
export function FAQs({ items }: { items: Question[] }) {
  return (
    <div className={s.faq}>
      {items.map((item) => (
        <details key={item.q}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}
export function Closing() {
  return (
    <Section>
      <div className={s.dark}>
        <div>
          <p className={s.eyebrow}>A clear next step</p>
          <h2>
            Start with the detail.
            <br />
            We’ll help with the document.
          </h2>
        </div>
        <div>
          <p>
            Tell us about your vehicle, the task and the information you need.
            The exact deliverables, format and any revisions should be agreed
            before an order is placed.
          </p>
          <div className={s.actions}>
            <Action />
          </div>
        </div>
      </div>
    </Section>
  );
}
