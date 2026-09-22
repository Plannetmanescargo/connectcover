import {
  Page,
  Section,
  Action,
  documentMetadata,
  s,
} from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Cookies and browser storage",
  "How the Coverza document preview remembers your cookie choice.",
  "/cookies",
);
export default function Cookies() {
  return (
    <Page
      eyebrow="Browser preferences"
      title="A clear view of browser storage."
      intro="The document frontend remembers your preference. It does not add optional analytics or advertising scripts."
    >
      <Section>
        <div className={s.article}>
          <section>
            <h2>Your saved choice</h2>
            <p>
              The preference control stores accepted or rejected in this
              browser’s local storage under Coverza_cookie_choice. The choice is
              shared with the existing site’s preference banner. Accepting does
              not, by itself, add a tracking service.
            </p>
          </section>
          <section>
            <h2>Changing your preference</h2>
            <p>
              Clear this site’s saved data in your browser settings to remove
              the preference and see the choice again. Your browser may also
              remove other saved settings for this site.
            </p>
          </section>
          <section>
            <h2>Existing service pages</h2>
            <p>
              Quote, checkout and retrieval are separate existing journeys.
              Their security and session behaviour has not been changed by this
              preview. The final storage inventory must be checked before
              launch.
            </p>
          </section>
          <div className={s.actions}>
            <Action href="/privacy" secondary>
              Read the privacy notice
            </Action>
          </div>
        </div>
      </Section>
    </Page>
  );
}
