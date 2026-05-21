// components/site/Footer.tsx
import Link from "next/link";
import Image from "next/image";

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="link text-sm text-slate-600 hover:text-slate-950">
      {children}
    </Link>
  );
}

const trustPoints = [
  "Secure online checkout",
  "Instant documents after purchase",
  "Retrieve your policy anytime",
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200/70 bg-white/70 backdrop-blur">
      <div className="container-app py-14">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          {/* Brand / intro */}
          <div>
            <Link
              href="/"
              aria-label="Coverza home"
              className="inline-flex items-center gap-2 rounded-xl transition-opacity hover:opacity-95"
            >
              <Image
                src="/brand/Connectcoverbig.png"
                alt=""
                width={42}
                height={42}
                className="h-[23px] w-[23px] object-contain sm:h-[25px] sm:w-[25px]"
              />

              <div className="flex items-baseline leading-none">
                <span className="text-[1.1rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[1.18rem]">
                  Coverza
                </span>
                <span
                  aria-hidden="true"
                  className="ml-[1px] text-[1.1rem] font-semibold leading-none text-[rgb(255,92,92)] sm:text-[1.18rem]"
                >
                  .
                </span>
              </div>
            </Link>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              Flexible temporary vehicle insurance designed to be quicker, clearer
              and easier to manage. Choose the cover you need, pay securely online,
              and receive your documents in minutes.
            </p>

            <div className="mt-6 grid gap-2.5">
              {trustPoints.map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-[rgb(108,76,243)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <p className="mt-6 max-w-xl text-[12px] leading-6 text-slate-500">
              Cover is subject to eligibility, underwriting and acceptance. Always
              review your Certificate of Motor Insurance, Statement of Fact and
              policy wording before driving.
            </p>
          </div>

          {/* Links */}
          <div className="lg:justify-self-end lg:w-full lg:max-w-[32rem]">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-900">
                  Support
                </div>
                <div className="mt-4 flex flex-col gap-2.5">
                  <FooterLink href="/help-support">Help centre</FooterLink>
                  <FooterLink href="/contact">Contact</FooterLink>
                  <FooterLink href="/complaints">Complaints</FooterLink>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-900">
                  Company
                </div>
                <div className="mt-4 flex flex-col gap-2.5">
                  <FooterLink href="/privacy">Privacy</FooterLink>
                  <FooterLink href="/terms">Terms</FooterLink>
                  <FooterLink href="/cookies">Cookies</FooterLink>
                  <FooterLink href="/more/faq">FAQs</FooterLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory block */}
        <div className="mt-10 rounded-[1.5rem] border border-slate-200/80 bg-white/72 p-5 backdrop-blur sm:p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-900">
            Regulatory information
          </div>

          <div className="mt-4 grid gap-4 text-[11px] leading-6 text-slate-600 sm:text-[12px]">
            <p>
              We hereby certify that the policy satisfies the requirements of the
              relevant law applicable in Great Britain, Northern Ireland, the Isle
              of Man, and the islands of Alderney, Guernsey and Jersey.
            </p>

            <p>
              Coverza operates using an insurance and administration structure
              that is subject to underwriting, regulation and insurer approval.
              Full regulatory and insurer details should be shown exactly as required
              by your legal and compliance documentation.
              Coverza Limited is authorised by the Gibraltar Financial Services Commission to carry on
              insurance business under the Financial Services Act 2019 and Financial Services Regulations 2020,
              registered address 5/5 Crutchett’s Ramp, Gibraltar, GX11 1AA. Details about our regulation by the Financial
              Conduct Authority and Prudential Regulation Authority are available on request.
            </p>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            © {new Date().getFullYear()} Coverza. All rights reserved.
          </div>

          <div className="text-xs text-slate-500">
            Secure checkout • Instant documents • Policy retrieval
          </div>
        </div>
      </div>
    </footer>
  );
}