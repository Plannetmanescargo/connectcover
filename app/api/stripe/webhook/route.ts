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

  // Final amount after Square coupons/discounts.
  total_money?: SquareMoney;

  // Total discount applied by Square.
  total_discount_money?: SquareMoney;

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

function isPositiveIntegerAmount(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  );
}

function normaliseCurrency(
  value: string | undefined
): string {
  return value?.trim().toUpperCase() ?? "";
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

/**
 * Records an unsuccessful payment attempt without permanently failing
 * the whole checkout.
 *
 * A buyer can retry the same Square payment link. Each attempt may use
 * a different Square payment ID, so failed or cancelled attempt IDs
 * must not be stored in PaymentCheckout.squarePaymentId.
 *
 * An already-paid checkout is never downgraded.
 */
async function recordUnsuccessfulPaymentAttempt(args: {
  checkoutId: string;
  squarePaymentId: string;
  squareStatus: string;
}): Promise<void> {
  const {
    checkoutId,
    squarePaymentId,
    squareStatus,
  } = args;

  console.warn(
    "[square webhook] unsuccessful payment attempt",
    {
      checkoutId,
      squarePaymentId,
      squareStatus,
    }
  );

  await prisma.paymentCheckout
    .updateMany({
      where: {
        id: checkoutId,
        status: {
          not: "PAID",
        },
      },
      data: {
        status: "PENDING",
      },
    })
    .catch((error: unknown) => {
      console.error(
        "[square webhook] failed to preserve pending checkout",
        {
          checkoutId,
          squarePaymentId,
          squareStatus,
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

  /*
   * Older webhook logic may have stored a failed attempt's payment ID.
   *
   * A valid completed payment may recover a PENDING or FAILED checkout
   * and replace that stale payment ID.
   *
   * Once the checkout is PAID, a different payment ID must never
   * overwrite the successful payment.
   */
  if (
    checkout.status === "PAID" &&
    checkout.squarePaymentId &&
    checkout.squarePaymentId !== payment.id
  ) {
    throw new Error(
      "Paid PaymentCheckout is already linked to a different Square payment."
    );
  }

  if (
    checkout.status !== "PAID" &&
    checkout.squarePaymentId &&
    checkout.squarePaymentId !== payment.id
  ) {
    console.warn(
      "[square webhook] replacing stale payment attempt",
      {
        checkoutId: checkout.id,
        previousPaymentId:
          checkout.squarePaymentId,
        completedPaymentId: payment.id,
        previousStatus: checkout.status,
      }
    );
  }

  /*
   * Coupon-aware payment verification.
   *
   * checkout.totalAmountPence:
   * Original amount quoted by Coverza before a Square coupon.
   *
   * order.total_money.amount:
   * Final amount calculated by Square after coupons/discounts.
   *
   * payment.total_money.amount:
   * Amount Square actually charged.
   */
  const originalCoverzaAmount =
    checkout.totalAmountPence;

  const squareOrderTotal =
    order.total_money?.amount;

  const paidAmount =
    payment.total_money?.amount;

  const orderCurrency = normaliseCurrency(
    order.total_money?.currency
  );

  const paidCurrency = normaliseCurrency(
    payment.total_money?.currency
  );

  const expectedCurrency =
    checkout.currency.trim().toUpperCase();

  const squareDiscountAmount =
    typeof order.total_discount_money?.amount ===
      "number" &&
    Number.isInteger(
      order.total_discount_money.amount
    )
      ? order.total_discount_money.amount
      : Math.max(
          0,
          originalCoverzaAmount -
            (typeof squareOrderTotal === "number"
              ? squareOrderTotal
              : originalCoverzaAmount)
        );

  const paymentIsValid =
    isPositiveIntegerAmount(
      originalCoverzaAmount
    ) &&
    isPositiveIntegerAmount(squareOrderTotal) &&
    isPositiveIntegerAmount(paidAmount) &&

    // Payment must exactly equal Square's final order total.
    paidAmount === squareOrderTotal &&

    // Square must never charge more than Coverza quoted.
    squareOrderTotal <= originalCoverzaAmount &&

    // Order and payment currencies must match Coverza.
    orderCurrency === expectedCurrency &&
    paidCurrency === expectedCurrency &&

    // Coverza currently operates in GBP only.
    expectedCurrency === "GBP";

  if (!paymentIsValid) {
    console.error(
      "[square webhook] invalid payment or discounted order total",
      {
        checkoutId: checkout.id,
        paymentId: payment.id,
        orderId: payment.order_id,

        originalCoverzaAmount,
        squareOrderTotal:
          squareOrderTotal ?? null,
        paidAmount: paidAmount ?? null,

        squareDiscountAmount,

        expectedCurrency,
        orderCurrency,
        paidCurrency,
      }
    );

    /*
     * This is a completed, potentially charged payment, so do not mark
     * it as an ordinary failed checkout and do not acknowledge it as
     * successfully handled.
     *
     * Keep the checkout recoverable and throw so Square can retry the
     * webhook instead of permanently considering it handled.
     */
    await prisma.paymentCheckout.updateMany({
      where: {
        id: checkout.id,
        status: {
          not: "PAID",
        },
      },
      data: {
        status: "PENDING",
      },
    });

    throw new Error(
      "Completed Square payment failed amount or currency validation."
    );
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

    /*
     * Store the final amount actually paid after any valid
     * Square coupon or voucher.
     */
    totalAmountPence: paidAmount,

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
    currency: expectedCurrency,

    // Square has no Stripe PaymentIntent ID.
    stripePaymentIntentId: null,
  });

  /*
   * Save the completed payment and resulting policy before document
   * fulfilment. This lets the success page find the policy immediately,
   * even while PDFs and email are still being processed.
   *
   * A previously FAILED or PENDING checkout is deliberately allowed to
   * recover to PAID here.
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

    originalCoverzaAmount,
    squareDiscountAmount,
    finalPaidAmount: paidAmount,
    currency: expectedCurrency,
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
   *
   * FAILED or CANCELED represents an unsuccessful payment attempt, not
   * necessarily a permanently failed checkout. The buyer may retry the
   * same payment link and receive a new payment ID.
   */
  if (payment.status !== "COMPLETED") {
    if (
      payment.status === "FAILED" ||
      payment.status === "CANCELED"
    ) {
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
            await recordUnsuccessfulPaymentAttempt({
              checkoutId:
                failedCheckoutId,
              squarePaymentId:
                payment.id,
              squareStatus:
                payment.status,
            });
          }
        } catch (error: unknown) {
          console.error(
            "[square webhook] failed to record unsuccessful payment attempt",
            {
              paymentId: payment.id,
              orderId:
                payment.order_id,
              status:
                payment.status,
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
     * Return 500 for genuine processing failures.
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