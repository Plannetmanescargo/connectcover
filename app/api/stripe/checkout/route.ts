// app/api/stripe/checkout/route.ts
import { NextResponse } from "next/server";

import { prisma } from "@/db/prisma";

export const runtime = "nodejs";

const SQUARE_API_VERSION = "2026-07-15";

const SQUARE_PAYMENT_LINK_URL =
  "https://connect.squareup.com/v2/online-checkout/payment-links";

type LicenceType =
  | "UK"
  | "International"
  | "Learner";

type CheckoutRequestBody = {
  quote: {
    vrm: string;
    make?: string | null;
    model?: string | null;
    year?: string | null;
    startAt: string;
    endAt: string;
    durationMs: number;
    totalAmountPence: number;
  };

  customer: {
    fullName: string;
    dob: string;
    email: string;
    licenceType: LicenceType;
    address: string;
  };
};

type SquareError = {
  category?: string;
  code?: string;
  detail?: string;
  field?: string;
};

type SquarePaymentLinkResponse = {
  payment_link?: {
    id?: string;
    version?: number;
    order_id?: string;
    url?: string;
    long_url?: string;
    created_at?: string;
  };

  related_resources?: {
    orders?: Array<{
      id?: string;
      reference_id?: string;
    }>;
  };

  errors?: SquareError[];
};

type ValidatedCheckout = {
  quote: {
    vrm: string;
    make: string | null;
    model: string | null;
    year: string | null;
    startAt: Date;
    endAt: Date;
    durationMs: number;
    totalAmountPence: number;
  };

  customer: {
    fullName: string;
    dob: Date;
    email: string;
    licenceType: LicenceType;
    address: string;
  };
};

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function getOrigin(request: Request): string {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim();

  if (configuredBaseUrl) {
    return stripTrailingSlash(configuredBaseUrl);
  }

  const headerOrigin = request.headers.get("origin");

  if (headerOrigin) {
    return stripTrailingSlash(headerOrigin);
  }

  const requestUrl = new URL(request.url);

  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    requestUrl.host;

  const protocol =
    request.headers.get("x-forwarded-proto") ||
    requestUrl.protocol.replace(":", "");

  return `${protocol}://${host}`;
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normaliseOptionalString(
  value: string | null | undefined
): string | null {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function getSquareErrorMessage(
  response: SquarePaymentLinkResponse,
  fallback: string
): string {
  const details =
    response.errors
      ?.map((error) => error.detail || error.code)
      .filter(Boolean)
      .join("; ") ?? "";

  return details || fallback;
}

function isLicenceType(
  value: unknown
): value is LicenceType {
  return (
    value === "UK" ||
    value === "International" ||
    value === "Learner"
  );
}

function validateCheckoutBody(
  body: CheckoutRequestBody
):
  | {
      ok: true;
      value: ValidatedCheckout;
    }
  | {
      ok: false;
      error: string;
    } {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      error: "Invalid checkout request.",
    };
  }

  if (!body.quote || typeof body.quote !== "object") {
    return {
      ok: false,
      error: "Missing quote information.",
    };
  }

  if (
    !body.customer ||
    typeof body.customer !== "object"
  ) {
    return {
      ok: false,
      error: "Missing customer information.",
    };
  }

  const vrm = body.quote.vrm?.trim().toUpperCase();

  if (!vrm) {
    return {
      ok: false,
      error: "Missing quote.vrm",
    };
  }

  const fullName = body.customer.fullName?.trim();

  if (!fullName) {
    return {
      ok: false,
      error: "Missing customer.fullName",
    };
  }

  const email = normaliseEmail(
    body.customer.email ?? ""
  );

  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return {
      ok: false,
      error: "Invalid customer.email",
    };
  }

  const address = body.customer.address?.trim();

  if (!address) {
    return {
      ok: false,
      error: "Missing customer.address",
    };
  }

  if (!isLicenceType(body.customer.licenceType)) {
    return {
      ok: false,
      error: "Invalid customer.licenceType",
    };
  }

  const startAt = new Date(body.quote.startAt);
  const endAt = new Date(body.quote.endAt);
  const dob = new Date(body.customer.dob);

  if (Number.isNaN(startAt.getTime())) {
    return {
      ok: false,
      error: "Invalid quote.startAt",
    };
  }

  if (Number.isNaN(endAt.getTime())) {
    return {
      ok: false,
      error: "Invalid quote.endAt",
    };
  }

  if (endAt.getTime() <= startAt.getTime()) {
    return {
      ok: false,
      error: "quote.endAt must be after quote.startAt",
    };
  }

  if (Number.isNaN(dob.getTime())) {
    return {
      ok: false,
      error: "Invalid customer.dob",
    };
  }

  if (dob.getTime() > Date.now()) {
    return {
      ok: false,
      error: "customer.dob cannot be in the future",
    };
  }

  const durationMs = Number(body.quote.durationMs);
  const totalAmountPence = Number(
    body.quote.totalAmountPence
  );

  if (
    !Number.isFinite(durationMs) ||
    !Number.isInteger(durationMs) ||
    durationMs <= 0
  ) {
    return {
      ok: false,
      error: "Invalid quote.durationMs",
    };
  }

  if (
    !Number.isFinite(totalAmountPence) ||
    !Number.isInteger(totalAmountPence) ||
    totalAmountPence <= 0
  ) {
    return {
      ok: false,
      error: "Invalid quote.totalAmountPence",
    };
  }

  const calculatedDurationMs =
    endAt.getTime() - startAt.getTime();

  const durationToleranceMs = 5 * 60 * 1000;

  if (
    Math.abs(calculatedDurationMs - durationMs) >
    durationToleranceMs
  ) {
    return {
      ok: false,
      error:
        "quote.durationMs does not match quote.startAt and quote.endAt",
    };
  }

  return {
    ok: true,
    value: {
      quote: {
        vrm,
        make: normaliseOptionalString(body.quote.make),
        model: normaliseOptionalString(
          body.quote.model
        ),
        year: normaliseOptionalString(body.quote.year),
        startAt,
        endAt,
        durationMs,
        totalAmountPence,
      },

      customer: {
        fullName,
        dob,
        email,
        licenceType: body.customer.licenceType,
        address,
      },
    },
  };
}

export async function POST(request: Request) {
  let paymentCheckoutId: string | null = null;

  try {
    const squareAccessToken =
      process.env.SQUARE_ACCESS_TOKEN?.trim();

    const squareLocationId =
      process.env.SQUARE_LOCATION_ID?.trim();

    if (!squareAccessToken) {
      console.error(
        "[square checkout] missing SQUARE_ACCESS_TOKEN"
      );

      return NextResponse.json(
        {
          error:
            "Payment service is not configured correctly.",
        },
        {
          status: 500,
        }
      );
    }

    if (!squareLocationId) {
      console.error(
        "[square checkout] missing SQUARE_LOCATION_ID"
      );

      return NextResponse.json(
        {
          error:
            "Payment service is not configured correctly.",
        },
        {
          status: 500,
        }
      );
    }

    let rawBody: unknown;

    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    const validation = validateCheckoutBody(
      rawBody as CheckoutRequestBody
    );

    if (!validation.ok) {
      return NextResponse.json(
        {
          error: validation.error,
        },
        {
          status: 400,
        }
      );
    }

    const { quote, customer } = validation.value;

    /*
     * Store all quote and customer information in our own database.
     *
     * Square receives only this checkout record's opaque ID as the
     * order reference_id. No DOB, address or policy data is stored
     * in Square notes or metadata.
     */
    const paymentCheckout =
      await prisma.paymentCheckout.create({
        data: {
          brand: "coverza",
          status: "PENDING",

          vrm: quote.vrm,
          make: quote.make,
          model: quote.model,
          year: quote.year,
          startAt: quote.startAt,
          endAt: quote.endAt,
          durationMs: BigInt(quote.durationMs),
          totalAmountPence:
            quote.totalAmountPence,

          fullName: customer.fullName,
          dob: customer.dob,
          email: customer.email,
          licenceType: customer.licenceType,
          address: customer.address,

          paymentProvider: "SQUARE",
          currency: "GBP",
        },
        select: {
          id: true,
        },
      });

    paymentCheckoutId = paymentCheckout.id;

    const origin = getOrigin(request);

    const successUrl =
      `${origin}/checkout/success` +
      `?provider=square` +
      `&checkout_id=${encodeURIComponent(
        paymentCheckout.id
      )}`;

    /*
     * Square creates an order and a hosted checkout page.
     *
     * reference_id connects the resulting Square order back to our
     * PaymentCheckout row without exposing customer information.
     */
    const squareRequest = {
      idempotency_key: paymentCheckout.id,

      order: {
        location_id: squareLocationId,
        reference_id: paymentCheckout.id,

        line_items: [
          {
            name:
              "Coverza Temporary Insurance Policy",
            quantity: "1",

            base_price_money: {
              amount: quote.totalAmountPence,
              currency: "GBP",
            },
          },
        ],
      },

      checkout_options: {
        redirect_url: successUrl,
        allow_tipping: false,
        ask_for_shipping_address: false,
        enable_coupon: false,
        enable_loyalty: false,
      },

      pre_populated_data: {
        buyer_email: customer.email,
      },

      description:
        "Coverza temporary vehicle insurance policy",
    };

    const squareResponse = await fetch(
      SQUARE_PAYMENT_LINK_URL,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${squareAccessToken}`,
          "Content-Type": "application/json",
          "Square-Version": SQUARE_API_VERSION,
        },

        body: JSON.stringify(squareRequest),
        cache: "no-store",
      }
    );

    const responseText = await squareResponse.text();

    let squareResult: SquarePaymentLinkResponse = {};

    if (responseText) {
      try {
        squareResult = JSON.parse(
          responseText
        ) as SquarePaymentLinkResponse;
      } catch {
        console.error(
          "[square checkout] non-JSON Square response",
          {
            status: squareResponse.status,
            responseText,
          }
        );
      }
    }

    if (!squareResponse.ok) {
      const squareError = getSquareErrorMessage(
        squareResult,
        "Square failed to create the checkout page."
      );

      console.error("[square checkout] API error", {
        status: squareResponse.status,
        checkoutId: paymentCheckout.id,
        errors: squareResult.errors,
        responseText,
      });

      await prisma.paymentCheckout
        .update({
          where: {
            id: paymentCheckout.id,
          },
          data: {
            status: "FAILED",
          },
        })
        .catch((databaseError: unknown) => {
          console.error(
            "[square checkout] failed to mark checkout as failed",
            {
              checkoutId: paymentCheckout.id,
              error: getErrorMessage(databaseError),
            }
          );
        });

      return NextResponse.json(
        {
          error: squareError,
        },
        {
          status:
            squareResponse.status >= 500 ? 502 : 400,
        }
      );
    }

    const checkoutUrl =
      squareResult.payment_link?.url ??
      squareResult.payment_link?.long_url;

    const squarePaymentLinkId =
      squareResult.payment_link?.id;

    const squareOrderId =
      squareResult.payment_link?.order_id ??
      squareResult.related_resources?.orders?.[0]?.id;

    if (
      !checkoutUrl ||
      !squarePaymentLinkId ||
      !squareOrderId
    ) {
      console.error(
        "[square checkout] incomplete Square response",
        {
          checkoutId: paymentCheckout.id,
          paymentLink:
            squareResult.payment_link ?? null,
          relatedResources:
            squareResult.related_resources ?? null,
        }
      );

      await prisma.paymentCheckout
        .update({
          where: {
            id: paymentCheckout.id,
          },
          data: {
            status: "FAILED",
          },
        })
        .catch(() => undefined);

      return NextResponse.json(
        {
          error:
            "Square did not return a complete checkout response.",
        },
        {
          status: 502,
        }
      );
    }

    await prisma.paymentCheckout.update({
      where: {
        id: paymentCheckout.id,
      },

      data: {
        squarePaymentLinkId,
        squareOrderId,
      },
    });

    console.log("[square checkout] created", {
      checkoutId: paymentCheckout.id,
      paymentLinkId: squarePaymentLinkId,
      orderId: squareOrderId,
      brand: "coverza",
      amountPence: quote.totalAmountPence,
    });

    /*
     * Preserve the response shape expected by the existing frontend.
     * The frontend only needs data.url to redirect the customer.
     */
    return NextResponse.json(
      {
        url: checkoutUrl,
        provider: "square",
        checkoutId: paymentCheckout.id,
        orderId: squareOrderId,
      },
      {
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("[square checkout] route error", {
      checkoutId: paymentCheckoutId,
      error: getErrorMessage(error),
    });

    if (paymentCheckoutId) {
      await prisma.paymentCheckout
        .update({
          where: {
            id: paymentCheckoutId,
          },
          data: {
            status: "FAILED",
          },
        })
        .catch(() => undefined);
    }

    return NextResponse.json(
      {
        error:
          "We could not start the payment. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}