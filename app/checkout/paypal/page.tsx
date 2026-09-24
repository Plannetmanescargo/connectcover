import { notFound, redirect } from "next/navigation";
import PageShell from "@/components/site/PageShell";
import { prisma } from "@/db/prisma";
import { getPayPalConfig } from "@/lib/paypal/config";
import PayPalCheckout from "./PayPalCheckout";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Secure checkout | Coverza", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Page({ searchParams }: { searchParams: Promise<{ checkout_id?: string }> }) {
  const { checkout_id: id } = await searchParams;
  if (!id || !/^[a-zA-Z0-9_-]{10,128}$/.test(id)) notFound();
  const row = await prisma.paymentCheckout.findUnique({ where: { id } });
  if (!row || row.paymentProvider !== "PAYPAL" || row.brand !== "coverza") notFound();
  if (row.status !== "PENDING" || row.paypalReviewReason || row.paypalCaptureStartedAt) redirect(`/checkout/success?provider=paypal&checkout_id=${encodeURIComponent(id)}`);
  let c: ReturnType<typeof getPayPalConfig>;
  try { c = getPayPalConfig(); } catch {
    return <PageShell hideHero><section className="mx-auto max-w-lg px-6 py-16"><h1 className="text-3xl font-bold">Checkout is temporarily unavailable</h1><p className="mt-4">Please try again shortly or contact support.</p></section></PageShell>;
  }
  if (row.paypalMode !== c.mode || row.paypalConfigHash !== c.fingerprint || !row.paypalOrderId) notFound();
  return <PageShell hideHero crumbs={[{ label: "Home", href: "/" }, { label: "Secure checkout" }]}>
    <section className="mx-auto max-w-lg px-6 py-12 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Secure checkout</p>
      <h1 className="mt-3 text-3xl font-bold text-slate-950">Complete your purchase</h1>
      <div className="my-7 flex items-center justify-between border-y border-slate-200 py-5"><span>Vehicle cover</span><strong className="text-2xl">£{(row.totalAmountPence / 100).toFixed(2)}</strong></div>
      <PayPalCheckout checkoutId={id} orderId={row.paypalOrderId} clientId={c.clientId} mode={c.mode}
        amount={(row.totalAmountPence / 100).toFixed(2)} applePay={c.applePay} googlePay={c.googlePay} />
      <p className="mt-6 text-sm leading-6 text-slate-500">Payments are securely processed by PayPal. Available payment methods depend on your device and account. Your cover is confirmed after payment verification.</p>
    </section>
  </PageShell>;
}
