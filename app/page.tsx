import {
  Page,
  Section,
  Cards,
  FAQs,
  Closing,
  Action,
  documentMetadata,
  s,
} from "@/components/documents/Pages";
import { serviceCards, faqs } from "@/content/documents/services";
export const metadata = documentMetadata(
  "Automotive documents, clearly explained",
  "Vehicle-specific documents, technical guides, configuration instructions and supporting digital resources from Coverza.",
  "/",
);
export default function HomePage() {
  return (
    <Page
      eyebrow="Coverza / automotive documentation"
      title="Technical detail. Made clear."
      intro="Vehicle documents and digital resources that bring the important information together. From coding guidance to compatibility notes, start with a clearly defined service."
      illustration
      cta
    >
      <div className={s.band}>
        <div className={`${s.wrap} ${s.bandInner}`}>
          <span>01 / Vehicle-specific information</span>
          <span>02 / An agreed scope</span>
          <span>03 / Electronic delivery</span>
        </div>
      </div>
      <Section
        eyebrow="Find your starting point"
        title="One place for the detail that matters."
        intro="Explore the service that matches your enquiry. We’ll help establish the documents and supporting information you need."
        id="services"
      >
        <Cards items={serviceCards} four />
      </Section>
      <Section
        eyebrow="What we can provide"
        title="More than a file. A useful reference."
        intro="Each order has its own scope. These are the types of deliverables that may form part of your service."
      >
        <Cards
          items={[
            {
              title: "Technical guidance",
              text: "Automotive coding solution documents, configuration instructions, diagnostic guidance and technical guides.",
            },
            {
              title: "Vehicle & software references",
              text: "Vehicle-specific documents, compatibility information, software-related references and explanatory notes.",
            },
            {
              title: "Supporting documentation",
              text: "A proposal, service certificate, supporting digital documents, agreed updates or revisions, and access to customer support.",
            },
          ]}
        />
        <p className={s.fine}>
          A service certificate records only what the agreed service describes.
          It does not certify roadworthiness or grant authority to drive.
        </p>
      </Section>
      <Section
        eyebrow="Clear from the start"
        title="Know what’s included. Know what comes next."
        intro="The exact deliverables are determined by your order and the applicable service description."
      >
        <Cards
          items={[
            {
              title: "Share the requirement",
              text: "Tell us about the vehicle, the technical task and the information you already have.",
            },
            {
              title: "Agree the details",
              text: "Confirm the scope, compatibility requirements, delivery format, timeframe and any included revisions.",
            },
            {
              title: "Keep it accessible",
              text: "Receive your documents through the agreed electronic method and keep the reference for future support.",
            },
          ]}
        />
      </Section>
      <Section
        eyebrow="Electronic delivery"
        title="Your documents. Wherever you need them."
        intro="Email attachments, accessible PDFs, secure download links or another agreed digital method. Provide a valid destination so your delivery can reach you."
      >
        <div className={s.actions}>
          <Action href="/more/guides#delivery" secondary>
            Read the delivery guide
          </Action>
        </div>
      </Section>
      <Section eyebrow="Before you begin" title="A few clear answers.">
        <FAQs items={faqs.slice(0, 6)} />
        <div className={s.actions}>
          <Action href="/more/faq" secondary>
            All questions & answers
          </Action>
        </div>
      </Section>
      <Closing />
    </Page>
  );
}
