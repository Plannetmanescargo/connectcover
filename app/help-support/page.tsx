import {
  Page,
  Section,
  Cards,
  FAQs,
  Closing,
  documentMetadata,
} from "@/components/documents/Pages";
import { faqs } from "@/content/documents/services";
export const metadata = documentMetadata(
  "Document help & support",
  "Help with document delivery, compatibility questions, corrections and agreed revisions.",
  "/help-support",
);
export default function Help() {
  return (
    <Page
      eyebrow="Here to help"
      title="A clear answer. A useful next step."
      intro="Find help with your document, understand the service scope or tell us what needs attention."
    >
      <Section title="What can we help with?">
        <Cards
          items={[
            {
              title: "Access a document",
              text: "Check the original delivery message and destination. If the file or link is unavailable, send support your order reference.",
              href: "/contact",
              label: "Get delivery help",
            },
            {
              title: "Check suitability",
              text: "Confirm the vehicle, equipment, software version and intended task before relying on a guide.",
              href: "/more/guides#compatibility",
              label: "Read the compatibility guide",
            },
            {
              title: "Request a correction",
              text: "Tell us the document version, the detail that is wrong and the correct information. We’ll review the request against your order.",
              href: "/contact",
              label: "Contact support",
            },
          ]}
        />
      </Section>
      <Section title="Answers before you message">
        <FAQs items={faqs.slice(1)} />
      </Section>
      <Closing />
    </Page>
  );
}
