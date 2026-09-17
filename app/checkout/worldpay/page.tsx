import Link from "next/link";
import { redirect } from "next/navigation";
import PageShell from "@/components/site/PageShell";
import { prisma } from "@/db/prisma";

export const dynamic = "force-dynamic";

export default async function WorldpayResultPage({ searchParams }: {
  searchParams: Promise<{ checkout_id?: string; result?: string }>;
}) {
  const params = await searchParams;
  const id = typeof params.checkout_id === "string" ? params.checkout_id : "";
  const checkout = id ? await prisma.paymentCheckout.findUnique({ where: { id }, select: { status: true, paymentProvider: true } }) : null;
  if (checkout?.paymentProvider === "WORLDPAY" && checkout.status === "PAID") {
    redirect(`/checkout/success?provider=worldpay&checkout_id=${encodeURIComponent(id)}`);
  }
  return <PageShell hideHero crumbs={[{ label: "Home", href: "/" }, { label: "Checkout" }]}>
    <section className="mx-auto max-w-xl px-6 py-16 text-center">
      <h1 className="text-3xl font-bold">Your checkout wasn’t completed</h1>
      <p className="mt-5 text-slate-600">We haven’t confirmed a payment for this checkout. If your bank shows a payment, check its status before trying again.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-5">
        {id && <Link className="underline" href={`/checkout/success?provider=worldpay&checkout_id=${encodeURIComponent(id)}`}>Check payment status</Link>}
        <Link className="underline" href="/get-quote">Return to your quote</Link>
        <Link className="underline" href="/help-support">Contact support</Link>
      </div>
    </section>
  </PageShell>;
}
