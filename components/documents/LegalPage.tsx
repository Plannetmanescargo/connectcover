import Link from "next/link";
import { Page, Section, s } from "./Pages";
import { terms, privacy } from "@/content/documents/legal";
export default function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const items = kind === "terms" ? terms : privacy;
  return (
    <Page
      eyebrow="Document service / review draft"
      title={
        kind === "terms"
          ? "Terms, clearly set out."
          : "Your information. Clearly explained."
      }
      intro="This document-service draft is for frontend review. It needs the confirmed operating details and service arrangements before launch."
    >
      <Section>
        <div className={s.article}>
          <p>
            Using an existing service?{" "}
            <Link href={`/existing-service/${kind}`}>
              Read the existing{" "}
              {kind === "terms" ? "service terms" : "privacy notice"}
            </Link>
            .
          </p>
          {items.map((x) => (
            <section key={x.title}>
              <h2>{x.title}</h2>
              {x.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
          ))}
          <section>
            <h2>Reference guidance</h2>
            {kind === "terms" ? (
              <p>
                <a href="https://www.gov.uk/online-and-distance-selling-for-businesses/online-selling">
                  GOV.UK: online selling and digital content
                </a>
              </p>
            ) : (
              <p>
                <a href="https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/">
                  ICO: information to provide about personal data
                </a>
              </p>
            )}
          </section>
        </div>
      </Section>
    </Page>
  );
}
