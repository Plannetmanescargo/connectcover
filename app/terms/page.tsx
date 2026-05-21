import PageShell from "@/components/site/PageShell";
import Link from "next/link";

function TermsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <PageShell
      hideHero
      crumbs={[{ label: "Home", href: "/" }, { label: "Terms & Conditions" }]}
    >
      {/* HERO */}
      <section className="pt-2 sm:pt-4 lg:pt-6">
        <div className="max-w-[76rem]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.14)] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
            Legal
          </div>

          <div className="relative mt-6 max-w-[70rem]">
            <div className="pointer-events-none absolute inset-x-0 top-[8%] -z-10 opacity-50 sm:top-[12%]">
              <svg
                viewBox="0 0 1200 260"
                className="h-[220px] w-full sm:h-[260px] lg:h-[300px]"
                fill="none"
                aria-hidden="true"
                preserveAspectRatio="none"
              >
                <path
                  d="M18 152C114 62 222 227 338 152C446 82 548 216 676 142C794 72 906 201 1026 132C1090 96 1142 105 1182 122"
                  stroke="rgba(108,76,243,0.14)"
                  strokeWidth="34"
                  strokeLinecap="round"
                />
                <path
                  d="M10 154C108 66 216 224 334 150C444 80 544 214 672 140C792 70 904 198 1024 130C1088 95 1140 103 1190 120"
                  stroke="rgba(108,76,243,0.28)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h1 className="heading-unbalanced relative max-w-[12ch] text-[3.25rem] font-extrabold leading-[0.9] tracking-[-0.07em] text-slate-950 sm:max-w-[10ch] sm:text-[4.55rem] lg:max-w-[9ch] lg:text-[5.85rem]">
              Terms &amp; Conditions
            </h1>
          </div>

          <p className="mt-10 max-w-[54rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
            These terms explain how you may use the Connect Cover website and related
            services, including quote journeys, policy retrieval and support pages.
          </p>

          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-700">
            {[
              "Clear and transparent",
              "Written for real customers",
              "Applies to website use and services",
            ].map((item) => (
              <div key={item} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 text-[12px] leading-6 text-slate-500">
            Last updated: 23.03.2026
          </div>

          <div className="mt-12 h-px w-full bg-[linear-gradient(90deg,rgba(226,232,240,0),rgba(226,232,240,0.95),rgba(226,232,240,0))]" />
        </div>
      </section>

      {/* TERMS BODY */}
      <section className="mt-16">
        <div className="max-w-[64rem] rounded-[2rem] border border-slate-200/80 bg-white/88 p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Connect Cover Terms &amp; Conditions
          </div>

          <TermsSection title="1. About these terms">
            <p>
              These Terms &amp; Conditions apply to your use of the Connect Cover
              website and any related online journeys, including requesting quotes,
              purchasing cover, retrieving documents and contacting support.
            </p>
            <p>
              By using this website, you agree to these terms. If you do not agree,
              you should not use the website or related services.
            </p>
          </TermsSection>

          <TermsSection title="2. Who we are">
            <p>
              In these terms, “Connect Cover”, “we”, “us” and “our” refer to the
              business operating this website and associated customer journeys.
            </p>
            <p>
              <strong>Business name:</strong> Connect Cover Limited
              <br />
              <strong>Registered address:</strong> 5/5 Crutchett’s Ramp, Gibraltar, GX11 1AA
              <br />
              <strong>Support email:</strong> support@connectcover.com
            </p>
          </TermsSection>

          <TermsSection title="3. Using this website">
            <p>
              You may use this website only for lawful purposes and in accordance with
              these terms.
            </p>
            <p>You agree not to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>use the site in any way that breaches applicable law or regulation</li>
              <li>provide false, misleading or incomplete information</li>
              <li>attempt to gain unauthorised access to our systems or services</li>
              <li>interfere with the operation, security or availability of the website</li>
              <li>copy, scrape, reproduce or exploit site content without permission</li>
              <li>use the site to submit fraudulent or abusive requests</li>
            </ul>
          </TermsSection>

          <TermsSection title="4. Quotes and eligibility">
            <p>
              Information shown during a quote journey is provided on the basis of the
              details you enter. Quotes, prices and availability may change if any
              information is inaccurate, incomplete or updated.
            </p>
            <p>
              Receiving a quote does not guarantee acceptance or cover. All insurance is
              subject to eligibility, underwriting criteria and insurer acceptance.
            </p>
            <p>
              It is your responsibility to ensure that all driver, vehicle and cover
              details entered are true, accurate and complete.
            </p>
          </TermsSection>

          <TermsSection title="5. Insurance products and policy documents">
            <p>
              Insurance products offered through Connect Cover are subject to the
              insurer’s terms, conditions, exclusions and policy wording.
            </p>
            <p>
              You should read all policy documents carefully, including the certificate,
              statement of fact, schedule, terms and any key information provided.
            </p>
            <p>
              If any detail appears incorrect, you should contact support as soon as
              possible.
            </p>
          </TermsSection>

          <TermsSection title="6. Payments and checkout">
            <p>
              Payments are processed through third-party payment providers. By making a
              payment, you agree to provide valid payment details and any information
              needed to complete checkout.
            </p>
            <p>
              We are not responsible for delays or failures caused by third-party payment
              providers, banking systems or payment security checks.
            </p>
            <p>
              A policy is not confirmed until payment has been successfully processed and,
              where applicable, policy creation has completed.
            </p>
          </TermsSection>

          <TermsSection title="7. Policy retrieval and document access">
            <p>
              Connect Cover may provide a retrieval service allowing you to access policy
              documents again using details such as your policy number and email address.
            </p>
            <p>
              This service is provided for convenience. We may require information to
              verify a retrieval request before documents are made available again.
            </p>
            <p>
              You are responsible for keeping your policy number and associated email
              details secure.
            </p>
          </TermsSection>

          <TermsSection title="8. Support and customer communications">
            <p>
              If you contact us, we may use the information you provide to respond to
              your request, verify your identity, help with documents or support your
              policy journey.
            </p>
            <p>
              We aim to keep support clear and helpful, but response times may vary
              depending on the issue and the information available.
            </p>
          </TermsSection>

          <TermsSection title="9. Website availability">
            <p>
              We try to keep the website and related services available at all times, but
              we do not guarantee uninterrupted or error-free access.
            </p>
            <p>
              We may suspend, withdraw, restrict or change all or any part of the website
              without notice for business, operational, security or maintenance reasons.
            </p>
          </TermsSection>

          <TermsSection title="10. Accuracy of content">
            <p>
              We aim to ensure that the information on the website is clear and up to
              date. However, content may occasionally be incomplete, out of date or
              affected by technical issues.
            </p>
            <p>
              Website content is for general information only and should always be read
              alongside your actual quote results, policy documents and any insurer-specific wording.
            </p>
          </TermsSection>

          <TermsSection title="11. Intellectual property">
            <p>
              All content on this website, including text, design, branding, graphics,
              layout and code, is owned by or licensed to Connect Cover unless stated
              otherwise.
            </p>
            <p>
              You may not reproduce, republish, distribute, modify or commercially use
              any part of this website without our prior written permission.
            </p>
          </TermsSection>

          <TermsSection title="12. Links to third-party websites">
            <p>
              This website may contain links to third-party sites or services. These links
              are provided for convenience only.
            </p>
            <p>
              We do not control third-party websites and are not responsible for their
              content, availability, security or privacy practices.
            </p>
          </TermsSection>

          <TermsSection title="13. Privacy and data protection">
            <p>
              Our use of personal information is explained in our{" "}
              <Link href="/privacy-policy" className="link font-semibold text-slate-900">
                Privacy Policy
              </Link>
              .
            </p>
            <p>
              By using the website and submitting information through our services, you
              acknowledge that we may process personal data in accordance with that policy.
            </p>
          </TermsSection>

          <TermsSection title="14. Liability">
            <p>
              Nothing in these terms excludes or limits liability where it would be
              unlawful to do so, including liability for fraud or for death or personal
              injury caused by negligence where the law does not allow such limitation.
            </p>
            <p>
              Subject to that, we will not be liable for any indirect, incidental,
              consequential or business losses arising from use of, or inability to use,
              the website or related services.
            </p>
            <p>
              We are also not responsible for losses arising from inaccurate information
              provided by you, temporary outages, third-party systems, payment provider
              issues, insurer decisions or delays outside our reasonable control.
            </p>
          </TermsSection>

          <TermsSection title="15. No guarantee of cover">
            <p>
              Use of this website, submission of details, receipt of a quote or use of
              the checkout journey does not by itself create an insurance contract.
            </p>
            <p>
              Cover begins only when all required steps have been completed successfully,
              payment has been accepted and the policy has been issued or confirmed in
              accordance with the insurer’s process.
            </p>
          </TermsSection>

          <TermsSection title="16. Changes to these terms">
            <p>
              We may update these Terms &amp; Conditions from time to time to reflect
              changes to our services, legal requirements or the way the site operates.
            </p>
            <p>
              The latest version will always be published on this page, together with the
              updated date shown above.
            </p>
          </TermsSection>

          <TermsSection title="17. Governing law">
            <p>
              These terms are governed by and interpreted in accordance with applicable
              law as determined by the relevant contractual and regulatory framework for
              the services being provided.
            </p>
            <p>
              Where required, disputes may be subject to the jurisdiction of the relevant
              courts or complaint handling bodies.
            </p>
          </TermsSection>

          <TermsSection title="18. Contact us">
            <p>
              If you have any questions about these Terms &amp; Conditions, please contact us:
            </p>
            <p>
              <strong>Email:</strong> support@connectcover.com
              <br />
              <strong>Address:</strong> 5/5 Crutchett’s Ramp, Gibraltar, GX11 1AA
            </p>
            <p>
              You can also visit our{" "}
              <Link href="/help-support" className="link font-semibold text-slate-900">
                Help &amp; Support
              </Link>{" "}
              or{" "}
              <Link href="/contact" className="link font-semibold text-slate-900">
                Contact
              </Link>{" "}
              pages.
            </p>
          </TermsSection>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16">
        <div className="rounded-[2rem] border border-[rgba(108,76,243,0.10)] bg-[linear-gradient(180deg,rgba(245,242,255,0.72),rgba(255,255,255,0.94))] px-6 py-10 shadow-sm sm:px-8 sm:py-12 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="heading-unbalanced text-center text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:text-[3.4rem]">
              Need help with a policy or website journey?
            </h2>

            <div className="mx-auto mt-5 max-w-[38rem]">
              <p className="text-center text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
                If you need support, policy retrieval, or help with anything on the site,
                we’ll point you to the right next step.
              </p>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/help-support" className="btn-primary !text-white">
                Help &amp; Support
              </Link>

              <Link href="/contact" className="btn-ghost">
                Contact us
              </Link>
            </div>

            <div className="mt-5 text-[12px] leading-6 text-slate-500">
              Clear support, policy access and customer guidance.
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}