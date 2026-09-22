import {
  Page,
  Section,
  Cards,
  documentMetadata,
  s,
} from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Contact Coverza",
  "Discuss automotive documentation, delivery questions and revisions with Coverza.",
  "/contact",
);
export default function Contact() {
  return (
    <Page
      eyebrow="Contact Coverza"
      title="Let’s get the details right."
      intro="Tell us what you need documented or where you need help. Include the relevant vehicle or order information so your enquiry has a clear starting point."
    >
      <Section>
        <div className={s.dark}>
          <div>
            <h2>Start a conversation.</h2>
            <p className={s.intro}>
              For a service enquiry, delivery question or document correction.
            </p>
          </div>
          <div>
            <a
              className={s.button}
              href="mailto:support@coverza.uk?subject=Document%20service%20enquiry"
            >
              Email support ↗
            </a>
            <p className={s.fine}>support@coverza.uk</p>
            <p className={s.fine}>
              Opens your email app. Review and send your message there; opening
              the link does not submit an enquiry.
            </p>
          </div>
        </div>
      </Section>
      <Section title="Useful details to include">
        <Cards
          items={[
            {
              title: "For a new enquiry",
              text: "Your vehicle make, model and year, the relevant equipment or software version, and the task you need documented.",
            },
            {
              title: "For an existing document",
              text: "Your order reference, document name and version, plus a clear description of the issue or requested correction.",
            },
            {
              title: "Keep sensitive details private",
              text: "Do not email passwords, security codes or full payment card details. Start with a description; we can clarify what is needed.",
            },
          ]}
        />
      </Section>
    </Page>
  );
}
