import {
  Page,
  Section,
  Cards,
  Action,
  documentMetadata,
  s,
} from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Feedback and complaints",
  "Tell Coverza about an issue with a document, delivery or service.",
  "/complaints",
);
export default function Complaints() {
  return (
    <Page
      eyebrow="Feedback & complaints"
      title="Tell us what needs putting right."
      intro="If a document or service has not met the agreed requirements, explain what happened and the outcome you are looking for."
    >
      <Section>
        <Cards
          items={[
            {
              title: "Identify the order",
              text: "Include your order reference, document name and version, where available.",
            },
            {
              title: "Explain the issue",
              text: "Describe what was expected, what happened and any steps already taken. Include relevant dates.",
            },
            {
              title: "Set out the outcome",
              text: "Tell us whether you need clarification, a correction, help with delivery or another remedy.",
            },
          ]}
        />
        <div className={s.actions}>
          <Action href="mailto:support@coverza.uk?subject=Document%20service%20complaint">
            Email your complaint
          </Action>
        </div>
        <p className={s.fine}>
          This opens your email app. Send the message there. Keep a copy and
          avoid including passwords or full card details.
        </p>
      </Section>
    </Page>
  );
}
