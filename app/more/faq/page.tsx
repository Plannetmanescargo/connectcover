import {
  Page,
  Section,
  FAQs,
  Closing,
  documentMetadata,
} from "@/components/documents/Pages";
import { faqs } from "@/content/documents/services";
export const metadata = documentMetadata(
  "Document service FAQs",
  "Clear answers about service scope, compatibility, electronic delivery and customer support.",
  "/more/faq",
);
export default function FAQ() {
  return (
    <Page
      eyebrow="Questions & answers"
      title="The useful details. In plain language."
      intro="Understand what may be included, how delivery works and where to ask for help."
    >
      <Section>
        <FAQs items={faqs} />
      </Section>
      <Closing />
    </Page>
  );
}
