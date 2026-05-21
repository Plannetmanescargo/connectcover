import PageShell from "@/components/site/PageShell";
import Link from "next/link";

function PolicySection({
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

export default function PrivacyPolicyPage() {
  return (
    <PageShell
      hideHero
      crumbs={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]}
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

            <h1 className="heading-unbalanced relative max-w-[10ch] text-[3.25rem] font-extrabold leading-[0.9] tracking-[-0.07em] text-slate-950 sm:max-w-[9ch] sm:text-[4.55rem] lg:max-w-[8.5ch] lg:text-[5.85rem]">
              Privacy Policy
            </h1>
          </div>

          <p className="mt-10 max-w-[54rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
            This policy explains how Connect Cover collects, uses, stores and protects
            personal information when you use our website, request a quote, purchase
            cover, retrieve documents or contact support.
          </p>

          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-700">
            {[
              "Clear and transparent",
              "Built around real journeys",
              "Written for customers, not lawyers",
            ].map((item) => (
              <div key={item} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 text-[12px] leading-6 text-slate-500">
            Last updated: [23.03.2026]
          </div>

          <div className="mt-12 h-px w-full bg-[linear-gradient(90deg,rgba(226,232,240,0),rgba(226,232,240,0.95),rgba(226,232,240,0))]" />
        </div>
      </section>

      {/* POLICY BODY */}
      <section className="mt-16">
        <div className="max-w-[64rem] rounded-[2rem] border border-slate-200/80 bg-white/88 p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Connect Cover Privacy Policy
          </div>

          <PolicySection title="1. Who we are">
            <p>
              Connect Cover is responsible for the personal information collected
              through this website and related customer journeys.
            </p>
            <p>
              In this policy, “Connect Cover”, “we”, “us” and “our” mean the business
              operating this website and related insurance journeys.
            </p>
            <p>
              <strong>Data controller:</strong> Connect Cover Limited
              <br />
              <strong>Registered address:</strong> 5/5 Crutchett’s Ramp, Gibraltar, GX11 1AA
              <br />
              <strong>Contact email:</strong> support@connectcover.com
            </p>
            <p>
              If another insurer, underwriter, claims handler or service provider also
              processes your information as part of your policy, they may have their
              own privacy notice as well.
            </p>
          </PolicySection>

          <PolicySection title="2. What information we collect">
            <p>We may collect and process the following categories of information:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                identity details, such as your name, date of birth and policy reference
              </li>
              <li>
                contact details, such as your email address, postal address and phone number
              </li>
              <li>
                vehicle details, such as registration number, make, model and year
              </li>
              <li>
                quote and policy details, including requested cover period, selected product,
                policy number and document history
              </li>
              <li>
                driving and eligibility information you provide during a quote or application
              </li>
              <li>
                payment and checkout information, including transaction status and payment provider references
              </li>
              <li>
                communications with us, including support messages and retrieval requests
              </li>
              <li>
                technical and usage data, such as IP address, browser type, device information,
                pages visited and interaction data
              </li>
              <li>
                cookie and analytics data where these tools are used on the site
              </li>
            </ul>
          </PolicySection>

          <PolicySection title="3. How we collect your information">
            <p>We collect personal information in a number of ways, including when you:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>request a quote</li>
              <li>enter vehicle or driver details</li>
              <li>purchase a policy</li>
              <li>retrieve policy documents</li>
              <li>contact support</li>
              <li>browse our website</li>
              <li>interact with our emails or customer communications</li>
            </ul>
            <p>We may also receive information from trusted third parties, including:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>payment providers</li>
              <li>insurers and underwriters</li>
              <li>vehicle data and lookup providers</li>
              <li>document storage providers</li>
              <li>analytics, fraud prevention and technical hosting providers</li>
            </ul>
          </PolicySection>

          <PolicySection title="4. How we use your information">
            <p>We use your personal information to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>provide quotes and arrange insurance cover</li>
              <li>check eligibility and support underwriting decisions</li>
              <li>process payments and confirm purchases</li>
              <li>generate, store and deliver policy documents</li>
              <li>help you retrieve policies and certificates later</li>
              <li>respond to support requests and customer queries</li>
              <li>maintain, improve and secure our website and services</li>
              <li>prevent fraud, abuse and misuse of our systems</li>
              <li>meet legal, regulatory and compliance obligations</li>
              <li>keep internal records and audit trails</li>
            </ul>
          </PolicySection>

          <PolicySection title="5. Our lawful bases for processing">
            <p>
              We process your personal information where we have a lawful basis to do so
              under applicable data protection law, including:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>contract:</strong> where processing is necessary to provide a quote,
                arrange cover, fulfil a policy or help with retrieval and support
              </li>
              <li>
                <strong>legal obligation:</strong> where we must process information to comply
                with legal, regulatory or tax requirements
              </li>
              <li>
                <strong>legitimate interests:</strong> where we use information to operate,
                protect and improve our services, provided your rights do not override those interests
              </li>
              <li>
                <strong>consent:</strong> where consent is required for certain cookies,
                marketing or similar optional processing
              </li>
            </ul>
          </PolicySection>

          <PolicySection title="6. Sharing your information">
            <p>We may share personal information with trusted third parties where necessary, including:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>insurers, underwriters and policy administrators</li>
              <li>payment processors and checkout providers</li>
              <li>email and document delivery providers</li>
              <li>cloud hosting and storage providers</li>
              <li>analytics, fraud prevention and security providers</li>
              <li>customer support and communications providers</li>
              <li>professional advisers, auditors and legal advisers</li>
              <li>regulators, law enforcement or public bodies where required</li>
            </ul>
            <p>
              We do not sell your personal information. We only share information where
              there is a valid reason to do so.
            </p>
          </PolicySection>

          <PolicySection title="7. Payments">
            <p>
              Payments are processed through third-party payment providers. We do not
              store full card details on our own systems unless explicitly stated
              otherwise.
            </p>
            <p>
              When you make a payment, the payment provider may collect and process your
              information in accordance with its own privacy notice and security procedures.
            </p>
          </PolicySection>

          <PolicySection title="8. Document delivery and retrieval">
            <p>
              If you purchase cover, we may email you policy documents and make them
              available for later retrieval using information such as your policy number
              and email address.
            </p>
            <p>
              We use this information to verify requests, resend documents and keep your
              policy journey clear and accessible.
            </p>
          </PolicySection>

          <PolicySection title="9. Cookies and analytics">
            <p>
              We may use cookies and similar technologies to run the website, remember
              preferences, understand usage and improve performance.
            </p>
            <p>
              Some cookies are essential for the site to function. Others may be optional,
              such as analytics or marketing cookies, and may only be used where required
              consent has been given.
            </p>
            <p>
              You should also provide a separate cookie policy or cookie banner if your site
              uses non-essential cookies.
            </p>
          </PolicySection>

          <PolicySection title="10. How long we keep information">
            <p>
              We keep personal information only for as long as reasonably necessary for
              the purposes set out in this policy, including:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>providing quotes and policies</li>
              <li>supporting document retrieval</li>
              <li>resolving disputes and complaints</li>
              <li>meeting regulatory and legal retention requirements</li>
              <li>maintaining financial and audit records</li>
            </ul>
            <p>
              Retention periods may vary depending on the type of data, the product,
              and applicable legal or regulatory obligations.
            </p>
          </PolicySection>

          <PolicySection title="11. International transfers">
            <p>
              Some of our service providers may process information outside the UK.
              Where this happens, we take steps to ensure appropriate safeguards are in
              place to protect personal information, such as recognised transfer mechanisms
              or contractual protections where required.
            </p>
          </PolicySection>

          <PolicySection title="12. How we protect your information">
            <p>
              We use appropriate technical and organisational measures designed to protect
              personal information against unauthorised access, loss, misuse, alteration
              or disclosure.
            </p>
            <p>
              These measures may include access controls, encryption, secure hosting,
              monitoring, authentication and limited access to data on a need-to-know basis.
            </p>
            <p>
              No online system is completely secure, but we work to keep your information
              appropriately protected.
            </p>
          </PolicySection>

          <PolicySection title="13. Your rights">
            <p>
              Depending on applicable law, you may have rights in relation to your
              personal information, including the right to:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>request access to your personal data</li>
              <li>request correction of inaccurate or incomplete data</li>
              <li>request deletion of your data in certain circumstances</li>
              <li>request restriction of processing in certain circumstances</li>
              <li>object to certain processing</li>
              <li>request transfer of your data where applicable</li>
              <li>withdraw consent where processing relies on consent</li>
              <li>complain to a supervisory authority</li>
            </ul>
            <p>
              To exercise any of these rights, contact us using the details set out below.
            </p>
          </PolicySection>

          <PolicySection title="14. Children’s data">
            <p>
              Our website and services are not intended for children except where a
              specific product journey lawfully requires learner-driver or similar data.
              Where such products are offered, the information must still be provided
              lawfully and accurately.
            </p>
          </PolicySection>

          <PolicySection title="15. Third-party links">
            <p>
              Our website may contain links to third-party websites or services. We are
              not responsible for the privacy practices of those third parties. You should
              review their privacy notices separately.
            </p>
          </PolicySection>

          <PolicySection title="16. Changes to this policy">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in
              our services, legal requirements or the way we process information.
            </p>
            <p>
              The latest version will always be published on this page, together with the
              updated date shown near the top.
            </p>
          </PolicySection>

          <PolicySection title="17. Contact us">
            <p>
              If you have any questions about this Privacy Policy or how your information
              is used, please contact us:
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
          </PolicySection>

          <PolicySection title="18. Complaints">
            <p>
              If you are unhappy with how we handle your personal information, please
              contact us first so we can try to resolve the issue.
            </p>
            <p>
              You may also have the right to complain to the Information Commissioner’s
              Office in the UK.
            </p>
          </PolicySection>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16">
        <div className="rounded-[2rem] border border-[rgba(108,76,243,0.10)] bg-[linear-gradient(180deg,rgba(245,242,255,0.72),rgba(255,255,255,0.94))] px-6 py-10 shadow-sm sm:px-8 sm:py-12 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="heading-unbalanced text-center text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:text-[3.4rem]">
              Need help with a policy or your data?
            </h2>

            <div className="mx-auto mt-5 max-w-[38rem]">
              <p className="text-center text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
                If you need support, document retrieval, or help with a privacy-related
                request, we’ll point you to the right next step.
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
              Clear support, policy access, and customer guidance.
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}