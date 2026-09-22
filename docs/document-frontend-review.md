# Coverza document frontend — review branch

Repository: Plannetmanescargo/connectcover. Branch: refresh/coverza-document-frontend.

## Scope

Rebuilt public homepage, car, van, learner, impound/collection, help, contact,
resource hub, guides, journal, FAQs, terms and privacy. Added working frontend
support, cookies and complaints routes. Public views reuse the original layouts and global styling, with scoped styles for supporting components; the quote
flow, APIs, payments, webhooks, pricing, storage, generated customer documents,
email functions, middleware and dependencies are unchanged.

The root layout's three chrome imports select refreshed components only on an
explicit public-route allowlist. Other routes retain the existing Header, Footer
and CookieBanner implementations. Root metadata remains unchanged for those
routes; document pages override titles, descriptions, canonicals, social data
and robots. Review pages are noindex/nofollow.

## Intentional review boundary

Do not merge/deploy to production before frontend approval and service migration.
Public vehicle CTAs lead to the unchanged /get-quote journey, as requested for design review. The preview strip identifies that it is still the existing service.
No document-service prices, instant-delivery promises, reviews, accreditations or
compatibility guarantees were invented. Service certificates are described with
their actual limited purpose. Collection documents do not authorise release.

The contact API referenced by the old contact page does not exist in this repo.
The refreshed contact form prepares an email draft in the customer’s mail app and does not claim
messages were sent. Verify the support@coverza.uk mailbox before release.

## Legal and launch inputs still needed

- Confirm contracting entity/controller, address and service scope.
- Confirm actual deliverables for each category, prices and delivery timings.
- Confirm permitted document use, included revisions and any access expiry.
- Confirm processors, international transfers, security and retention details.
- Implement order terms and required digital-content cancellation consent before sales.
- Final legal review, then remove draft notes and change page indexing.

Existing privacy and terms text is preserved at /existing-service/privacy and
/existing-service/terms so the previous processing is not described as having
stopped. These are historical source copies, not newly verified legal claims.
No transaction route links or behaviours were changed. They require a coordinated
follow-up before any production switch.

## Content sources

Customer-provided screenshot: customer deliverables and electronic delivery.
https://www.gov.uk/online-and-distance-selling-for-businesses/online-selling
https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/

## Local review

npm ci
npm run dev
Open localhost URL printed by Next.js. Review narrow mobile widths and desktop.

## Design revision: restore the Coverza identity

The public pages now reuse the original page layouts and global styling, with
service-specific copy. Header/footer variants retain the original brand image,
wordmark, navigation treatment and footer structure. The homepage restores
hero-car-4.png, hero-car-5.png and hero-car-6.png, image triptych, editorial
sections, layered product cards and support panel. No stock replacement imagery
was needed. The former testimonial design now presents service expectations,
without reattributing old insurance testimonials to a different service.

Vehicle CTAs read “Enter vehicle details” and link to /get-quote as requested.
The preview strip explains that this is still the existing journey. No quote,
checkout, retrieval or backend implementation is changed. This remains a design review branch.

Product selectors now switch between overview, guidance, delivery and support.
Original FAQ search/filter and blog topic interactions are restored. Guides and
articles have complete in-page content. The contact form uses the original visual
layout as an email-draft composer and never claims that opening a mail app sent
an enquiry. The legal pages use the original typography and a contents sidebar;
the legal draft approval requirements above still apply.
