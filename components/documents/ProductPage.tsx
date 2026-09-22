import { Page, Section, Cards, FAQs, Closing, s } from "./Pages";
import { productContent, faqs } from "@/content/documents/services";
export default function ProductPage({
  kind,
}: {
  kind: keyof typeof productContent;
}) {
  const p = productContent[kind];
  return (
    <Page
      eyebrow="Vehicle documentation"
      title={p.title}
      intro={p.intro}
      illustration
      cta
    >
      <Section
        eyebrow="Defined by your order"
        title="The right information, in a useful format."
        intro="Examples of deliverables to discuss. Your service description determines what is included."
      >
        <div className={s.sectionHead}>
          <ul className={s.list}>
            {p.items.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <div>
            <h3>Start with the specification</h3>
            <p className={s.intro}>{p.scope}</p>
          </div>
        </div>
      </Section>
      <Section title="Clear scope. Clear expectations.">
        <Cards
          items={[
            {
              title: "Agree the task",
              text: "Confirm the vehicle details, intended use, deliverables and any prerequisites before ordering.",
            },
            {
              title: "Receive digitally",
              text: "Use the agreed email address or delivery destination. Delivery method and timing depend on your order.",
            },
            {
              title: "Keep the reference",
              text: "Save your document, version and order reference. Ask support about corrections or agreed revisions.",
            },
          ]}
        />
        <p className={s.fine}>{p.limit}</p>
      </Section>
      <Section title="A few useful answers">
        <FAQs items={faqs.filter((_, i) => [1, 2, 3, 4, 6].includes(i))} />
      </Section>
      <Closing />
    </Page>
  );
}
