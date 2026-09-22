import {
  Page,
  Section,
  Cards,
  documentMetadata,
} from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Document resource hub",
  "Guides, FAQs and articles about automotive documentation and electronic delivery.",
  "/more",
);
export default function Hub() {
  return (
    <Page
      eyebrow="The resource hub"
      title="Everything a little clearer."
      intro="Practical guides, thoughtful explanations and answers to the questions that come up along the way."
    >
      <Section>
        <Cards
          items={[
            {
              title: "Guides",
              text: "Prepare a useful brief, check compatibility and keep your documents accessible.",
              href: "/more/guides",
              label: "Read the guides",
            },
            {
              title: "Questions & answers",
              text: "Understand service scope, delivery methods and what happens when you need a revision.",
              href: "/more/faq",
              label: "Browse the FAQs",
            },
            {
              title: "Journal",
              text: "A closer look at technical references, clear documentation and version information.",
              href: "/more/blog",
              label: "Explore the journal",
            },
          ]}
        />
      </Section>
    </Page>
  );
}
