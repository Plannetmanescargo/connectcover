import type { CardData, Question } from "@/components/documents/Pages";
export const serviceCards: CardData[] = [
  {
    title: "Car documents",
    text: "Vehicle-specific reference material, coding guidance and configuration notes for an agreed task.",
    href: "/car",
  },
  {
    title: "Van documents",
    text: "Technical references and supporting information organised around your van and its configuration.",
    href: "/van",
  },
  {
    title: "Learner resources",
    text: "Clear vehicle familiarisation notes and explanatory material for customers preparing to learn.",
    href: "/learner",
  },
  {
    title: "Collection documents",
    text: "Supporting document organisation and explanatory notes for a vehicle collection, including impound enquiries.",
    href: "/impound",
  },
];
export const faqs: Question[] = [
  {
    q: "What does Coverza provide?",
    a: "Automotive documentation and supporting digital resources. Depending on the agreed service, this may include vehicle-specific documents, coding or configuration instructions, technical guides, diagnostic guidance, software references and compatibility information.",
  },
  {
    q: "What will be included in my order?",
    a: "The exact deliverables are determined by your order and the applicable service description. A proposal, service certificate, explanatory notes, agreed revisions or updates are included only where specified. Ask us to clarify the scope before ordering.",
  },
  {
    q: "How are documents delivered?",
    a: "Electronically, using the method agreed for your order. This may be an email attachment, a secure download link, an accessible PDF, a customer-specific document link or another agreed digital method. You need to provide a valid, accessible email address or delivery destination.",
  },
  {
    q: "Are all vehicles and software versions supported?",
    a: "Compatibility needs to be checked for the specific vehicle, equipment and software version. A guide for a similar model is not confirmation that it applies to your vehicle. Share the relevant details before agreeing the service.",
  },
  {
    q: "Does a document authorise driving or release of a vehicle?",
    a: "No. A technical document or service certificate does not provide motor insurance, permission to drive or authority to release an impounded vehicle. You must meet the separate requirements of the relevant authority or collection operator.",
  },
  {
    q: "Will I receive documents instantly?",
    a: "Delivery timing depends on the service and the information required. Use the timeframe agreed for your order. We do not promise instant delivery for every type of document.",
  },
  {
    q: "Can I request corrections or revisions?",
    a: "Yes, contact support with your order reference, the document version and the detail that needs attention. Agreed revisions and updates depend on the scope of your order. A change of vehicle or task may need a separate assessment.",
  },
  {
    q: "What if my delivery link does not work?",
    a: "Check the original message, your junk folder and the email address used for the order. If you still cannot access the document, contact support with your order reference and a description of the problem. Do not send passwords or full payment card details.",
  },
];
export const productContent = {
  car: {
    title: "Car documents. Clear on the details.",
    intro:
      "Vehicle-specific documentation for the task in front of you. Bring the vehicle information, technical scope and supporting guidance together in one considered place.",
    items: [
      "Automotive coding solution documents",
      "Coding or configuration instructions",
      "Compatibility information and software references",
      "Diagnostic guidance and explanatory notes",
    ],
    scope:
      "Tell us the make, model, year and relevant equipment or software version, together with the task you want help documenting. Vehicle registration alone may not establish compatibility.",
    limit:
      "Documentation describes the agreed service. It does not confirm that a modification is safe, lawful, approved by a manufacturer or suitable for every vehicle.",
  },
  van: {
    title: "Van documents. Built around the specification.",
    intro:
      "Technical reference material and supporting documents for your van, with the configuration, task and limitations made clear before you proceed.",
    items: [
      "Vehicle-specific technical references",
      "Configuration and compatibility notes",
      "Diagnostic guidance for an agreed enquiry",
      "Supporting PDFs, updates and agreed revisions",
    ],
    scope:
      "Provide the vehicle specification and the details of any relevant installed equipment or previous changes. Different variants can require different guidance even when the model name is the same.",
    limit:
      "An operating guide or configuration document does not approve a conversion, certify roadworthiness or replace a qualified assessment of the vehicle.",
  },
  learner: {
    title: "Learner resources. A clearer place to start.",
    intro:
      "Vehicle familiarisation documents and explanatory notes, scoped to the information you need. A useful reference alongside practical instruction.",
    items: [
      "Vehicle-specific explanatory notes",
      "Guidance on reading supplied vehicle information",
      "Agreed reference sheets and supporting documents",
      "Digital copies and agreed revisions",
    ],
    scope:
      "Tell us which vehicle the resources relate to and what you need explained. We can discuss the available documentation and whether it matches the intended use before an order is agreed.",
    limit:
      "These resources do not replace a qualified instructor, official driving guidance, licence requirements or the arrangements needed for lawful supervised practice.",
  },
  impound: {
    title: "Collection documents. Know what you have.",
    intro:
      "Supporting documents and explanatory notes for a vehicle collection enquiry. Organise the information you have and identify what still needs confirming with the collection operator.",
    items: [
      "An agreed document checklist",
      "Vehicle-specific supporting information",
      "Explanatory notes on supplied records",
      "Digital document organisation and agreed revisions",
    ],
    scope:
      "Ask the pound or collection operator for its current requirements first. Share the relevant request with us so we can explain the documentation we can provide and its limits.",
    limit:
      "We cannot authorise release, waive charges or guarantee acceptance. Our documents are not proof of ownership, a release authorisation or a substitute for any required motor insurance.",
  },
};
