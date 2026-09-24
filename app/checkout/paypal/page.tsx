import { notFound, redirect } from "next/navigation";
import PageShell from "@/components/site/PageShell";
import { prisma } from "@/db/prisma";
import { getPayPalConfig } from "@/lib/paypal/config";
import CheckoutView from "./CheckoutView";
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
  return <CheckoutView checkoutId={id} orderId={row.paypalOrderId} clientId={c.clientId} mode={c.mode}
    totalAmountPence={row.totalAmountPence} applePay={c.applePay} googlePay={c.googlePay} />;
}
