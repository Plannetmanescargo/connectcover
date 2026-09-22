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
    <Link
      href={href}
      className="link text-sm text-slate-600 hover:text-slate-950"
    >
      {children}
    </Link>
  );
}

const trustPoints = [
  "Clearly defined service scope",
  "Delivery as agreed",
  "Support with your documents",
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
                src="/brand/connectcoverbig.png"
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
              Vehicle-specific documents, technical guidance and supporting
              digital resources. Thoughtfully presented, clearly scoped and
              delivered through the electronic method agreed for your order.
            </p>

            <div className="mt-6 grid gap-2.5">
              {trustPoints.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2.5 text-sm text-slate-600"
                >
                  <span className="h-2 w-2 rounded-full bg-[rgb(108,76,243)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <p className="mt-6 max-w-xl text-[12px] leading-6 text-slate-500">
              Read the scope and limitations of each document. Technical
              resources and service certificates do not provide motor insurance
              or permission to drive.
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
            About your documents
          </div>

          <div className="mt-4 grid gap-4 text-[11px] leading-6 text-slate-600 sm:text-[12px]">
            <p>
              The exact deliverables are determined by your order and the
              applicable service description. A proposal, service certificate,
              revision or update is included only where agreed.
            </p>

            <p>
              Electronic delivery may use an email attachment, an accessible
              PDF, a secure download link or another agreed digital method. You
              must provide a valid, accessible destination. Supporting
              collection documents cannot authorise release, establish ownership
              or replace requirements set by the collection operator.
            </p>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            © {new Date().getFullYear()} Coverza. All rights reserved.
          </div>

          <div className="text-xs text-slate-500">
            Clear scope • Digital delivery • Helpful support
          </div>
        </div>
      </div>
    </footer>
  );
}
