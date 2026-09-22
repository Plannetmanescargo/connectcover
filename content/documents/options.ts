import { productContent, faqs } from "./services";
export type DocumentTab = "overview" | "guidance" | "delivery" | "support";
export function documentOptions(kind: keyof typeof productContent) {
  const p = productContent[kind];
  const cases = p.items.map((title, i) => ({
    title,
    desc: [
      "Confirm the purpose, vehicle specification and intended use before the scope is agreed.",
      "Read the prerequisites and limitations alongside any instructions supplied.",
      "Keep the document version and supporting references together for later use.",
      "Ask about the format, delivery method and any updates included in your order.",
    ][i],
  }));
  return {
    overview: {
      label: "Overview",
      title: p.title,
      intro: p.intro,
      bullets: [
        "Vehicle-specific scope",
        "Clear prerequisites",
        "Electronic delivery",
      ],
      useCases: cases,
      faqs: faqs.slice(0, 5),
    },
    guidance: {
      label: "Guidance",
      title: "Understand what applies to your vehicle.",
      intro: p.scope,
      bullets: [
        "Confirm the specification",
        "Check compatibility",
        "Read the limitations",
      ],
      useCases: cases,
      faqs: [faqs[3], faqs[4], faqs[1]],
    },
    delivery: {
      label: "Delivery",
      title: "A digital copy. An agreed destination.",
      intro:
        "Receive the deliverables through the electronic method agreed for your order: an email attachment, accessible PDF, secure link or another agreed digital method.",
      bullets: [
        "A valid email address",
        "An agreed timeframe",
        "A useful reference",
      ],
      useCases: [
        {
          title: "Email attachments",
          desc: "Use an accessible inbox and check your delivery message and junk folder.",
        },
        {
          title: "PDF documents",
          desc: "Check you can open the supplied file and keep its reference and version.",
        },
        {
          title: "Customer-specific links",
          desc: "Keep delivery links private and contact support if access fails.",
        },
        {
          title: "Agreed alternatives",
          desc: "Other electronic delivery methods can be specified in the service description.",
        },
      ],
      faqs: [faqs[2], faqs[5], faqs[7]],
    },
    support: {
      label: "Support",
      title: "Keep the detail up to date.",
      intro:
        "Ask about a correction, clarify the scope or discuss an agreed revision. Include your order reference and document version so the request is easy to identify.",
      bullets: [
        "Identify the document",
        "Describe the change",
        "Confirm the scope",
      ],
      useCases: [
        {
          title: "A detail needs correcting",
          desc: "Identify the relevant section and provide the correct information if known.",
        },
        {
          title: "A new requirement",
          desc: "A different vehicle, configuration or task may require a separately agreed service.",
        },
        {
          title: "An access problem",
          desc: "Describe the error and the delivery method without sharing private links publicly.",
        },
        {
          title: "An agreed update",
          desc: "Check which revisions are included in your order and keep the latest version.",
        },
      ],
      faqs: [faqs[6], faqs[7], faqs[1]],
    },
  };
}
