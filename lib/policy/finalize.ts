// lib/policy/finalize.ts
import { Prisma } from "@prisma/client";

import { prisma } from "@/db/prisma";
import type {
  PolicyFinalizeInput,
  PolicyFinalizeResult,
} from "./types";
import { validateFinalizeInput } from "./validate";
import { generatePolicyNumber } from "./policyNumber";

/**
 * Finalises a paid policy purchase in an idempotent way.
 *
 * Idempotency key:
 * paymentProvider + paymentId
 *
 * This supports both Stripe and Square because paymentProvider is now
 * a Prisma enum containing STRIPE and SQUARE.
 */
export async function finalizePolicy(
  input: PolicyFinalizeInput
): Promise<PolicyFinalizeResult> {
  const validation = validateFinalizeInput(input);

  if (!validation.ok) {
    throw new Error(validation.errors.join(" • "));
  }

  const normalisedInput = {
    ...input,
    vrm: input.vrm.trim().toUpperCase(),
    make: input.make?.trim() || null,
    model: input.model?.trim() || null,
    year: input.year?.trim() || null,

    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    address: input.address.trim(),

    paymentId: input.paymentId.trim(),
    currency: (input.currency ?? "GBP").trim().toUpperCase(),
  };

  /*
   * Return the existing policy when Square or another provider retries
   * the same successful payment webhook.
   */
  const existing = await prisma.policy.findUnique({
    where: {
      paymentProvider_paymentId: {
        paymentProvider: normalisedInput.paymentProvider,
        paymentId: normalisedInput.paymentId,
      },
    },
    select: {
      id: true,
      policyNumber: true,
    },
  });

  if (existing) {
    return {
      ok: true,
      policyId: existing.id,
      policyNumber: existing.policyNumber,
    };
  }

  /*
   * Retry only when there is an extremely rare collision on the generated
   * policy number.
   */
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const policyNumber = generatePolicyNumber();

    try {
      const created = await prisma.$transaction(async (tx) => {
        const policy = await tx.policy.create({
          data: {
            policyNumber,
            status: "PAID",

            // Quote
            vrm: normalisedInput.vrm,
            make: normalisedInput.make,
            model: normalisedInput.model,
            year: normalisedInput.year,
            startAt: new Date(normalisedInput.startAt),
            endAt: new Date(normalisedInput.endAt),
            durationMs: BigInt(
              Math.trunc(normalisedInput.durationMs)
            ),
            totalAmountPence:
              normalisedInput.totalAmountPence,

            // Customer
            fullName: normalisedInput.fullName,
            dob: new Date(normalisedInput.dob),
            email: normalisedInput.email,
            licenceType: normalisedInput.licenceType,
            address: normalisedInput.address,

            // Payment
            paymentProvider:
              normalisedInput.paymentProvider,
            paymentId: normalisedInput.paymentId,
            paymentStatus:
              normalisedInput.paymentStatus,
            currency: normalisedInput.currency,

            /*
             * Square does not have a Stripe PaymentIntent ID.
             * The Square webhook should pass null here.
             */
            stripePaymentIntentId:
              normalisedInput.stripePaymentIntentId ??
              null,

            events: {
              create: [
                {
                  type: "POLICY_CREATED",
                  data: {
                    paymentProvider:
                      normalisedInput.paymentProvider,
                    paymentId:
                      normalisedInput.paymentId,
                    paymentStatus:
                      normalisedInput.paymentStatus,
                  },
                },
                {
                  type: "PAYMENT_CONFIRMED",
                  data: {
                    paymentProvider:
                      normalisedInput.paymentProvider,
                    paymentId:
                      normalisedInput.paymentId,
                    paymentStatus:
                      normalisedInput.paymentStatus,
                    currency:
                      normalisedInput.currency,
                    totalAmountPence:
                      normalisedInput.totalAmountPence,
                  },
                },
              ],
            },
          },
          select: {
            id: true,
            policyNumber: true,
          },
        });

        return policy;
      });

      return {
        ok: true,
        policyId: created.id,
        policyNumber: created.policyNumber,
      };
    } catch (error: unknown) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        /*
         * A duplicate payment can occur if two Square webhook deliveries
         * are handled at almost the same time. Fetch and return the policy
         * already created by the other request.
         */
        const existingAfterCollision =
          await prisma.policy.findUnique({
            where: {
              paymentProvider_paymentId: {
                paymentProvider:
                  normalisedInput.paymentProvider,
                paymentId:
                  normalisedInput.paymentId,
              },
            },
            select: {
              id: true,
              policyNumber: true,
            },
          });

        if (existingAfterCollision) {
          return {
            ok: true,
            policyId: existingAfterCollision.id,
            policyNumber:
              existingAfterCollision.policyNumber,
          };
        }

        const target = error.meta?.target;

        const targetFields = Array.isArray(target)
          ? target.map(String)
          : typeof target === "string"
            ? [target]
            : [];

        const isPolicyNumberCollision =
          targetFields.some((field) =>
            field.includes("policyNumber")
          );

        if (isPolicyNumberCollision) {
          continue;
        }
      }

      throw error;
    }
  }

  throw new Error(
    "Failed to generate a unique policy number"
  );
}