import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("checkout_id");
  const reply = (confirmed: boolean, status = 200) => NextResponse.json(
    { confirmed }, { status, headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
  if (!id || id.length > 128) return reply(false, 400);
  // The opaque checkout ID is already used by the success page. Return no PII.
  const checkout = await prisma.paymentCheckout.findUnique({
    where: { id }, select: {
      brand: true, paymentProvider: true, status: true, policyId: true,
      worldpayTransactionReference: true,
    },
  });
  if (!checkout || checkout.brand !== "coverza" || checkout.paymentProvider !== "WORLDPAY" || checkout.status !== "PAID") return reply(false);
  const policy = checkout.policyId
    ? await prisma.policy.findUnique({ where: { id: checkout.policyId }, select: { id: true } })
    : checkout.worldpayTransactionReference
      ? await prisma.policy.findUnique({ where: { paymentProvider_paymentId: {
        paymentProvider: "WORLDPAY", paymentId: checkout.worldpayTransactionReference,
      } }, select: { id: true } })
      : null;
  return reply(Boolean(policy));
}
