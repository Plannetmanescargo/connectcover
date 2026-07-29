// app/api/stripe/webhook/route.ts
//
// The route path is temporarily still named "stripe",
// but this endpoint now handles Square webhooks.

import {
  createHmac,
  timingSafeEqual,
} from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/db/prisma";
import { finalizePolicy } from "@/lib/policy/finalize";
import { fulfillPolicy } from "@/lib/policy/fulfill";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SQUARE_API_VERSION = "2026-07-15";
const SQUARE_API_BASE_URL =
  "https://connect.squareup.com";

type LicenceType =
  | "UK"
  | "International"
  | "Learner";

type SquareMoney = {
  amount?: number;
  currency?: string;
};

type SquarePayment = {
  id?: string;
  order_id?: string;
  status?: string;
  location_id?: string;
  total_money?: SquareMoney;
  approved_money?: SquareMoney;
  customer_id?: string;
  buyer_email_address?: string;
  receipt_url?: string;
  created_at?: string;
  updated_at?: string;
};

type SquareRefund = {
  id?: string;
  payment_id?: string;
  order_id?: string;
  status?: string;
  amount_money?: SquareMoney;
  created_at?: string;
  updated_at?: string;
};

type SquareWebhookEvent = {
  merchant_id?: string;
  type?: string;
  event_id?: string;
  created_at?: string;

  data?: {
    type?: string;
    id?: string;

    object?: {
      payment?: SquarePayment;
      refund?: SquareRefund;
    };
  };
};

type SquareOrder = {
  id?: string;
  reference_id?: string;
  state?: string;
  location_id?: string;
  total_money?: SquareMoney;
  version?: number;
  created_at?: string;
  updated_at?: string;
};

type SquareApiError = {
  category?: string;
  code?: string;
  detail?: string;
  field?: string;
};

type RetrieveOrderResponse = {
  order?: SquareOrder;
  errors?: SquareApiError[];
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function acknowledge(
  extra: Record<string, unknown> = {}
): NextResponse {
  return NextResponse.json(
    {
      received: true,
      ...extra,
    },
    {
      status: 200,
    }
  );
}

function handlerError(
  message: string,
  extra: Record<string, unknown> = {}
): NextResponse {
  return NextResponse.json(
    {
      received: false,
      error: message,
      ...extra,
    },
    {
      status: 500,
    }
  );
}

function isLicenceType(
  value: string
): value is LicenceType {
  return (
    value === "UK" ||
    value === "International" ||
    value === "Learner"
  );
}

/**
 * Square signs:
 *
 * exact notification URL + exact raw request body
 *
 * using HMAC-SHA256. The resulting signature is Base64 encoded.
 */
function verifySquareSignature(args: {
  rawBody: string;
  signatureHeader: string;
  signatureKey: string;
  notificationUrl: string;
}): boolean {
  const {
    rawBody,
    signatureHeader,
    signatureKey,
    notificationUrl,
  } = args;

  const expectedSignature = createHmac(
    "sha256",
    signatureKey
  )
    .update(notificationUrl + rawBody, "utf8")
    .digest("base64");

  const expectedBuffer = Buffer.from(
    expectedSignature,
    "utf8"
  );

  const receivedBuffer = Buffer.from(
    signatureHeader,
    "utf8"
  );

  if (
    expectedBuffer.length !== receivedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
}

function getSquareApiError(
  response: RetrieveOrderResponse,
  fallback: string
): string {
  const details =
    response.errors
      ?.map(
        (error) =>
          error.detail ||
          error.code ||
          error.category
      )
      .filter(Boolean)
      .join("; ") ?? "";

  return details || fallback;
}

async function retrieveSquareOrder(args: {
  accessToken: string;
  orderId: string;
}): Promise<SquareOrder> {
  const { accessToken, orderId } = args;

  const response = await fetch(
    `${SQUARE_API_BASE_URL}/v2/orders/${encodeURIComponent(
      orderId
    )}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Square-Version": SQUARE_API_VERSION,
      },
      cache: "no-store",
    }
  );

  const responseText = await response.text();

  let result: RetrieveOrderResponse = {};

  if (responseText) {
    try {
      result = JSON.parse(
        responseText
      ) as RetrieveOrderResponse;
    } catch {
      throw new Error(
        `Square returned an invalid order response (${response.status}).`
      );
    }
  }

  if (!response.ok || !result.order) {
    throw new Error(
      getSquareApiError(
        result,
        "Unable to retrieve the Square order."
      )
    );
  }

  return result.order;
}

async function markCheckoutFailed(args: {
  checkoutId: string;
  squarePaymentId?: string;
}): Promise<void> {
  const { checkoutId, squarePaymentId } = args;

  await prisma.paymentCheckout
    .update({
      where: {
        id: checkoutId,
      },
      data: {
        status: "FAILED",
        squarePaymentId:
          squarePaymentId || undefined,
      },
    })
    .catch((error: unknown) => {
      console.error(
        "[square webhook] failed to mark checkout as failed",
        {
          checkoutId,
          error: getErrorMessage(error),
        }
      );
    });
}

async function processCompletedPayment(args: {
  payment: SquarePayment;
  squareAccessToken: string;
  squareLocationId: string;
}) {
  const {
    payment,
    squareAccessToken,
    squareLocationId,
  } = args;

  if (!payment.id) {
    throw new Error(
      "Completed Square payment is missing an ID."
    );
  }

  if (!payment.order_id) {
    throw new Error(
      "Completed Square payment is missing order_id."
    );
  }

  if (
    payment.location_id &&
    payment.location_id !== squareLocationId
  ) {
    throw new Error(
      "Square payment belongs to an unexpected location."
    );
  }

  const order = await retrieveSquareOrder({
    accessToken: squareAccessToken,
    orderId: payment.order_id,
  });

  if (!order.id) {
    throw new Error(
      "Retrieved Square order is missing an ID."
    );
  }

  if (order.id !== payment.order_id) {
    throw new Error(
      "Square order ID does not match the payment order ID."
    );
  }

  if (
    order.location_id &&
    order.location_id !== squareLocationId
  ) {
    throw new Error(
      "Square order belongs to an unexpected location."
    );
  }

  /*
   * The checkout route places PaymentCheckout.id in:
   *
   * order.reference_id
   *
   * No customer or policy data is recovered from Square metadata.
   */
  const checkoutId = order.reference_id?.trim();

  if (!checkoutId) {
    throw new Error(
      "Square order is missing reference_id."
    );
  }

  const checkout =
    await prisma.paymentCheckout.findUnique({
      where: {
        id: checkoutId,
      },
    });

  if (!checkout) {
    throw new Error(
      `PaymentCheckout not found for reference_id ${checkoutId}.`
    );
  }

  if (checkout.brand !== "coverza") {
    console.warn(
      "[square webhook] checkout belongs to another brand",
      {
        checkoutId: checkout.id,
        brand: checkout.brand,
      }
    );

    return {
      ignored: true as const,
      reason: "wrong_brand",
      checkoutId: checkout.id,
    };
  }

  if (
    checkout.paymentProvider !== "SQUARE"
  ) {
    throw new Error(
      "PaymentCheckout has an unexpected payment provider."
    );
  }

  if (
    checkout.squareOrderId &&
    checkout.squareOrderId !== payment.order_id
  ) {
    throw new Error(
      "Square payment order ID does not match PaymentCheckout."
    );
  }

  if (
    checkout.squarePaymentId &&
    checkout.squarePaymentId !== payment.id
  ) {
    throw new Error(
      "PaymentCheckout is already linked to a different Square payment."
    );
  }

  const paidAmount =
    payment.total_money?.amount;

  const paidCurrency =
    payment.total_money?.currency
      ?.trim()
      .toUpperCase() ?? "";

  if (
    !Number.isInteger(paidAmount) ||
    paidAmount !== checkout.totalAmountPence ||
    paidCurrency !== checkout.currency.toUpperCase()
  ) {
    console.error(
      "[square webhook] payment amount mismatch",
      {
        checkoutId: checkout.id,
        paymentId: payment.id,
        expectedAmount:
          checkout.totalAmountPence,
        paidAmount: paidAmount ?? null,
        expectedCurrency:
          checkout.currency,
        paidCurrency,
      }
    );

    await markCheckoutFailed({
      checkoutId: checkout.id,
      squarePaymentId: payment.id,
    });

    return {
      ignored: true as const,
      reason: "payment_amount_mismatch",
      checkoutId: checkout.id,
    };
  }

  if (!isLicenceType(checkout.licenceType)) {
    throw new Error(
      "PaymentCheckout contains an invalid licence type."
    );
  }

  /*
   * finalizePolicy is idempotent on:
   *
   * paymentProvider + paymentId
   *
   * Repeated Square webhook deliveries therefore return the existing
   * policy rather than creating another one.
   */
  const result = await finalizePolicy({
    // Quote
    vrm: checkout.vrm,
    make: checkout.make,
    model: checkout.model,
    year: checkout.year,
    startAt: checkout.startAt.toISOString(),
    endAt: checkout.endAt.toISOString(),
    durationMs: Number(checkout.durationMs),
    totalAmountPence:
      checkout.totalAmountPence,

    // Customer
    fullName: checkout.fullName,
    dob: checkout.dob.toISOString(),
    email: checkout.email,
    licenceType: checkout.licenceType,
    address: checkout.address,

    // Square payment
    paymentProvider: "SQUARE",
    paymentId: payment.id,
    paymentStatus: "PAID",
    currency: checkout.currency,

    // Square has no Stripe PaymentIntent ID.
    stripePaymentIntentId: null,
  });

  /*
   * Save the completed payment and resulting policy before document
   * fulfilment. This lets the success page find the policy immediately,
   * even while PDFs and email are still being processed.
   */
  await prisma.paymentCheckout.update({
    where: {
      id: checkout.id,
    },
    data: {
      status: "PAID",
      squareOrderId: payment.order_id,
      squarePaymentId: payment.id,
      policyId: result.policyId,
    },
  });

  console.log("[square finalize] completed", {
    checkoutId: checkout.id,
    paymentId: payment.id,
    orderId: payment.order_id,
    policyId: result.policyId,
    policyNumber: result.policyNumber,
  });

  /*
   * This function is designed to be rerunnable:
   * existing PDFs and recorded fulfilment events are reused.
   */
  const fulfilled = await fulfillPolicy(
    result.policyId
  );

  console.log("[square fulfill] completed", {
    checkoutId: checkout.id,
    paymentId: payment.id,
    policyId: result.policyId,
    policyNumber: fulfilled.policyNumber,
  });

  return {
    ignored: false as const,
    checkoutId: checkout.id,
    paymentId: payment.id,
    policyId: result.policyId,
    policyNumber: result.policyNumber,
  };
}

export async function POST(
  request: Request
): Promise<NextResponse> {
  const squareAccessToken =
    process.env.SQUARE_ACCESS_TOKEN?.trim();

  const squareLocationId =
    process.env.SQUARE_LOCATION_ID?.trim();

  const squareWebhookSignatureKey =
    process.env.SQUARE_WEBHOOK_SIGNATURE_KEY?.trim();

  /*
   * This must exactly match the URL entered in Square:
   *
   * https://www.coverza.co.uk/api/stripe/webhook
   *
   * The protocol, hostname, www and path must all match.
   */
  const squareWebhookNotificationUrl =
    process.env
      .SQUARE_WEBHOOK_NOTIFICATION_URL
      ?.trim();

  if (!squareAccessToken) {
    console.error(
      "[square webhook] missing SQUARE_ACCESS_TOKEN"
    );

    return NextResponse.json(
      {
        error:
          "Missing Square webhook configuration.",
      },
      {
        status: 500,
      }
    );
  }

  if (!squareLocationId) {
    console.error(
      "[square webhook] missing SQUARE_LOCATION_ID"
    );

    return NextResponse.json(
      {
        error:
          "Missing Square webhook configuration.",
      },
      {
        status: 500,
      }
    );
  }

  if (!squareWebhookSignatureKey) {
    console.error(
      "[square webhook] missing SQUARE_WEBHOOK_SIGNATURE_KEY"
    );

    return NextResponse.json(
      {
        error:
          "Missing Square webhook configuration.",
      },
      {
        status: 500,
      }
    );
  }

  if (!squareWebhookNotificationUrl) {
    console.error(
      "[square webhook] missing SQUARE_WEBHOOK_NOTIFICATION_URL"
    );

    return NextResponse.json(
      {
        error:
          "Missing Square webhook configuration.",
      },
      {
        status: 500,
      }
    );
  }

  const signatureHeader =
    request.headers
      .get(
        "x-square-hmacsha256-signature"
      )
      ?.trim();

  if (!signatureHeader) {
    return NextResponse.json(
      {
        error:
          "Missing Square webhook signature.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * Read the body exactly once as text.
   * Do not call request.json() before verification.
   */
  const rawBody = await request.text();

  const signatureIsValid =
    verifySquareSignature({
      rawBody,
      signatureHeader,
      signatureKey:
        squareWebhookSignatureKey,
      notificationUrl:
        squareWebhookNotificationUrl,
    });

  if (!signatureIsValid) {
    console.error(
      "[square webhook] invalid signature"
    );

    return NextResponse.json(
      {
        error:
          "Square webhook signature verification failed.",
      },
      {
        status: 403,
      }
    );
  }

  let event: SquareWebhookEvent;

  try {
    event = JSON.parse(
      rawBody
    ) as SquareWebhookEvent;
  } catch {
    return NextResponse.json(
      {
        error: "Invalid Square webhook JSON.",
      },
      {
        status: 400,
      }
    );
  }

  console.log("[square webhook] received", {
    eventId: event.event_id ?? null,
    type: event.type ?? null,
    merchantId: event.merchant_id ?? null,
  });

  /*
   * Refunds are currently logged only.
   * No automatic cancellation or policy-status change is performed.
   */
  if (event.type === "refund.updated") {
    const refund =
      event.data?.object?.refund;

    console.log(
      "[square webhook] refund update",
      {
        eventId: event.event_id ?? null,
        refundId: refund?.id ?? null,
        paymentId:
          refund?.payment_id ?? null,
        orderId: refund?.order_id ?? null,
        status: refund?.status ?? null,
        amount:
          refund?.amount_money?.amount ??
          null,
        currency:
          refund?.amount_money?.currency ??
          null,
      }
    );

    return acknowledge({
      handled: true,
      action: "refund_logged",
    });
  }

  if (
    event.type !== "payment.created" &&
    event.type !== "payment.updated"
  ) {
    return acknowledge({
      ignored: true,
      reason: "unsupported_event",
      eventType: event.type ?? null,
    });
  }

  const payment =
    event.data?.object?.payment;

  if (!payment?.id) {
    console.error(
      "[square webhook] missing payment object",
      {
        eventId: event.event_id ?? null,
      }
    );

    return acknowledge({
      ignored: true,
      reason: "missing_payment",
    });
  }

  console.log("[square webhook] payment", {
    eventId: event.event_id ?? null,
    paymentId: payment.id,
    orderId: payment.order_id ?? null,
    status: payment.status ?? null,
    locationId:
      payment.location_id ?? null,
    amount:
      payment.total_money?.amount ?? null,
    currency:
      payment.total_money?.currency ?? null,
  });

  /*
   * payment.created can arrive before the payment reaches its final
   * status. Only a COMPLETED payment may create a policy.
   */
  if (payment.status !== "COMPLETED") {
    if (
      payment.status === "FAILED" ||
      payment.status === "CANCELED"
    ) {
      /*
       * We cannot securely identify the checkout without its order,
       * so failure updates are best-effort only.
       */
      if (payment.order_id) {
        try {
          const failedOrder =
            await retrieveSquareOrder({
              accessToken:
                squareAccessToken,
              orderId: payment.order_id,
            });

          const failedCheckoutId =
            failedOrder.reference_id?.trim();

          if (failedCheckoutId) {
            await markCheckoutFailed({
              checkoutId:
                failedCheckoutId,
              squarePaymentId:
                payment.id,
            });
          }
        } catch (error: unknown) {
          console.error(
            "[square webhook] failed to record unsuccessful payment",
            {
              paymentId: payment.id,
              error:
                getErrorMessage(error),
            }
          );
        }
      }
    }

    return acknowledge({
      ignored: true,
      reason: "payment_not_completed",
      paymentStatus:
        payment.status ?? null,
    });
  }

  try {
    const result =
      await processCompletedPayment({
        payment,
        squareAccessToken,
        squareLocationId,
      });

    if (result.ignored) {
      return acknowledge({
        ignored: true,
        reason: result.reason,
        checkoutId:
          result.checkoutId,
      });
    }

    return acknowledge({
      handled: true,
      checkoutId: result.checkoutId,
      paymentId: result.paymentId,
      policyId: result.policyId,
      policyNumber:
        result.policyNumber,
    });
  } catch (error: unknown) {
    /*
     * Return 500 for a genuine processing failure.
     *
     * Square can retry the event, and finalizePolicy prevents duplicate
     * policies by enforcing paymentProvider + paymentId uniqueness.
     */
    console.error(
      "[square webhook] completed payment processing failed",
      {
        eventId: event.event_id ?? null,
        paymentId: payment.id,
        orderId:
          payment.order_id ?? null,
        error: getErrorMessage(error),
      }
    );

    return handlerError(
      "Completed payment processing failed."
    );
  }
}