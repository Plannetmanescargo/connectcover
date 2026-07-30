// app/api/policy/by-payment/route.ts

import type { PaymentProvider } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET examples:
 *
 * Square:
 * /api/policy/by-payment?provider=square&id=PAYMENT_ID
 *
 * Legacy Stripe:
 * /api/policy/by-payment?provider=stripe&id=cs_...
 */
function coerceProvider(
  value: string | null
): PaymentProvider | null {
  const provider = (
    value ?? ""
  )
    .trim()
    .toUpperCase();

  if (provider === "SQUARE") {
    return "SQUARE";
  }

  if (provider === "STRIPE") {
    return "STRIPE";
  }

  return null;
}

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function GET(
  request: Request
): Promise<NextResponse> {
  try {
    const url = new URL(request.url);

    const paymentId = (
      url.searchParams.get("id") ?? ""
    ).trim();

    if (!paymentId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing id",
        },
        {
          status: 400,
        }
      );
    }

    const rawProvider =
      url.searchParams.get("provider");

    const provider =
      coerceProvider(rawProvider);

    if (!provider) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid payment provider. Expected square or stripe.",
        },
        {
          status: 400,
        }
      );
    }

    const policy =
      await prisma.policy.findUnique({
        where: {
          paymentProvider_paymentId: {
            paymentProvider: provider,
            paymentId,
          },
        },

        select: {
          id: true,
          policyNumber: true,
          paymentStatus: true,
          createdAt: true,
        },
      });

    if (!policy) {
      return NextResponse.json(
        {
          ok: true,
          found: false,
        },
        {
          status: 200,
        }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        found: true,
        policy,
      },
      {
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error(
      "[policy by-payment] lookup failed",
      {
        error: getErrorMessage(error),
      }
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Lookup failed",
      },
      {
        status: 500,
      }
    );
  }
}