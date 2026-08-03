// lib/policy/fulfill.ts
import { Prisma } from "@prisma/client";
import { Resend } from "resend";

import { prisma } from "@/db/prisma";
import { sendPolicyEmail } from "@/lib/email/sendPolicyEmail";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type FulfillResult = {
  proposalUrl: string;
  certificateUrl: string;
  policyNumber: string;
  email: string;
};

type NewsletterSyncResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      skipped?: boolean;
    };

type WelcomeAutomationResult =
  | {
      ok: true;
      eventId: string | null;
    }
  | {
      ok: false;
      skipped?: boolean;
    };

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Server-safe Coverza URL resolver.
 *
 * Recommended Vercel value:
 * SITE_URL=https://www.coverza.co.uk
 */
function getSiteUrl(): string {
  const raw =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL;

  if (raw?.trim()) {
    return stripTrailingSlash(raw.trim());
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  throw new Error(
    "Missing SITE_URL. Set SITE_URL=https://www.coverza.co.uk in Vercel."
  );
}

function getInternalRenderKey(): string {
  const key = process.env.INTERNAL_RENDER_KEY?.trim();

  if (!key) {
    throw new Error("Missing INTERNAL_RENDER_KEY");
  }

  return key;
}

async function renderPdf(
  path: string,
  payload: Record<string, unknown>
): Promise<Buffer> {
  const baseUrl = getSiteUrl();
  const internalRenderKey = getInternalRenderKey();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-key": internalRenderKey,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");

      throw new Error(
        `Render failed ${path} (${response.status}): ${responseText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    return Buffer.from(arrayBuffer);
  } catch (error: unknown) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Render timed out"
        : getErrorMessage(error);

    throw new Error(`Render request failed ${path}: ${message}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function uploadPdf(
  bucket: string,
  key: string,
  pdf: Buffer
): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(key, pdf, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    throw new Error(
      `Failed to upload ${key} to Supabase: ${error.message}`
    );
  }

  const { data } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(key);

  if (!data.publicUrl) {
    throw new Error(`Supabase did not return a public URL for ${key}`);
  }

  return data.publicUrl;
}

async function syncCustomerToNewsletter(policy: {
  email: string;
  fullName: string | null;
}): Promise<NewsletterSyncResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const segmentId =
    process.env.RESEND_NEWSLETTER_SEGMENT_ID?.trim();
  const weeklyTopicId =
    process.env.RESEND_WEEKLY_TOPIC_ID?.trim();
  const monthlyTopicId =
    process.env.RESEND_MONTHLY_TOPIC_ID?.trim();

  if (
    !apiKey ||
    !segmentId ||
    !weeklyTopicId ||
    !monthlyTopicId
  ) {
    console.warn(
      "[resend contacts] skipped: missing Resend contact configuration"
    );

    return {
      ok: false,
      skipped: true,
    };
  }

  const resend = new Resend(apiKey);

  const fullName = (policy.fullName || "").trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);

  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  try {
    const created = await (resend.contacts as any).create({
      email: policy.email,
      firstName,
      lastName,
      unsubscribed: false,
    });

    if (created?.error) {
      const message = String(created.error.message || "");
      const lowerMessage = message.toLowerCase();

      const contactAlreadyExists =
        lowerMessage.includes("already exists") ||
        lowerMessage.includes("duplicate");

      if (!contactAlreadyExists) {
        throw new Error(
          message || "Failed to create Resend contact"
        );
      }
    }

    const updated = await (resend.contacts as any).update({
      email: policy.email,
      unsubscribed: false,
      firstName,
      lastName,
    });

    if (updated?.error) {
      throw new Error(
        updated.error.message ||
          "Failed to update Resend contact"
      );
    }

    const segmentResult = await (
      (resend.contacts as any).segments as any
    ).add({
      email: policy.email,
      segmentId,
    });

    if (segmentResult?.error) {
      throw new Error(
        segmentResult.error.message ||
          "Failed to add Resend contact to segment"
      );
    }

    const topicsResult = await (
      (resend.contacts as any).topics as any
    ).update({
      email: policy.email,
      topics: [
        {
          id: weeklyTopicId,
          subscription: "opt_in",
        },
        {
          id: monthlyTopicId,
          subscription: "opt_in",
        },
      ],
    });

    if (topicsResult?.error) {
      throw new Error(
        topicsResult.error.message ||
          "Failed to subscribe Resend contact to topics"
      );
    }

    return {
      ok: true,
    };
  } catch (error: unknown) {
    console.error("[resend contacts] failed", {
      email: policy.email,
      error: getErrorMessage(error),
    });

    return {
      ok: false,
    };
  }
}

async function triggerWelcomeAutomation(policy: {
  email: string;
  fullName: string | null;
  policyNumber: string;
}): Promise<WelcomeAutomationResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    console.warn(
      "[resend welcome] skipped: missing RESEND_API_KEY"
    );

    return {
      ok: false,
      skipped: true,
    };
  }

  const resend = new Resend(apiKey);

  const fullName = (policy.fullName || "").trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);

  const firstName = nameParts[0] || "there";
  const lastName = nameParts.slice(1).join(" ");

  try {
    const eventResult = await (resend as any).events.send({
      event: "contact.welcome",
      email: policy.email,
      payload: {
        firstName,
        lastName,
        policyNumber: policy.policyNumber,
        source: "policy_purchase",
      },
    });

    if (eventResult?.error) {
      throw new Error(
        eventResult.error.message ||
          "Failed to trigger welcome automation"
      );
    }

    return {
      ok: true,
      eventId: eventResult?.data?.id ?? null,
    };
  } catch (error: unknown) {
    console.error("[resend welcome] failed", {
      email: policy.email,
      policyNumber: policy.policyNumber,
      error: getErrorMessage(error),
    });

    return {
      ok: false,
    };
  }
}

export async function fulfillPolicy(
  policyId: string
): Promise<FulfillResult> {
  const policy = await prisma.policy.findUnique({
    where: {
      id: policyId,
    },
    include: {
      documents: true,
    },
  });

  if (!policy) {
    throw new Error("Policy not found");
  }

  const existingProposal =
    policy.documents.find(
      (document) => document.kind === "PROPOSAL"
    )?.url ?? null;

  const existingCertificate =
    policy.documents.find(
      (document) => document.kind === "CERTIFICATE"
    )?.url ?? null;

  let proposalUrl = existingProposal ?? "";
  let certificateUrl = existingCertificate ?? "";

  /*
   * Generate and upload documents only when either required document
   * is missing.
   */
  if (!existingProposal || !existingCertificate) {
    const baseUrl = getSiteUrl();

    const proposalPayload: Record<string, unknown> = {
      policyNumber: policy.policyNumber,
      createdAtISO: policy.createdAt.toISOString(),

      vrm: policy.vrm,
      make: policy.make ?? null,
      model: policy.model ?? null,
      year: policy.year ?? null,
      startAtISO: policy.startAt.toISOString(),
      endAtISO: policy.endAt.toISOString(),
      durationMs: Number(policy.durationMs),

      fullName: policy.fullName,
      dobISO: policy.dob.toISOString().slice(0, 10),
      email: policy.email,
      address: policy.address,
      licenceType: policy.licenceType,

      issuedBy: "Accelerant",
      baseUrl,
      signatureUrl: "/brand/signature.png",
    };

    const certificateNumber = policy.policyNumber;

    const certificatePayload: Record<string, unknown> = {
      certificateNumber,
      policyNumber: policy.policyNumber,

      vrm: policy.vrm,
      make: policy.make ?? null,
      model: policy.model ?? null,
      year: policy.year ?? null,

      policyholderName: policy.fullName,

      startAtISO: policy.startAt.toISOString(),
      endAtISO: policy.endAt.toISOString(),

      baseUrl,
      signatureUrl: "/brand/signature.png",
    };

    const proposalPdf = await renderPdf(
      "/api/internal/policy/render-proposal",
      proposalPayload
    );

    const certificatePdf = await renderPdf(
      "/api/internal/policy/render-certificate",
      certificatePayload
    );

    const bucket = "policy-documents";
    const baseKey = `policies/${policy.policyNumber}`;

    const proposalKey =
      `${baseKey}/proposal-${policy.policyNumber}.pdf`;

    const certificateKey =
      `${baseKey}/certificate-${certificateNumber}.pdf`;

    proposalUrl = await uploadPdf(
      bucket,
      proposalKey,
      proposalPdf
    );

    certificateUrl = await uploadPdf(
      bucket,
      certificateKey,
      certificatePdf
    );

    await prisma.$transaction(async (transaction) => {
      const currentDocuments =
        await transaction.policyDocument.findMany({
          where: {
            policyId,
          },
        });

      const hasProposal = currentDocuments.some(
        (document) => document.kind === "PROPOSAL"
      );

      const hasCertificate = currentDocuments.some(
        (document) => document.kind === "CERTIFICATE"
      );

      if (!hasProposal) {
        await transaction.policyDocument.create({
          data: {
            policyId,
            kind: "PROPOSAL",
            filename: `proposal-${policy.policyNumber}.pdf`,
            storageProvider: "SUPABASE",
            storageKey: proposalKey,
            url: proposalUrl,
          },
        });
      }

      if (!hasCertificate) {
        await transaction.policyDocument.create({
          data: {
            policyId,
            kind: "CERTIFICATE",
            filename:
              `certificate-${certificateNumber}.pdf`,
            storageProvider: "SUPABASE",
            storageKey: certificateKey,
            url: certificateUrl,
          },
        });
      }

      const docsGeneratedEvent =
        await transaction.policyEvent.findFirst({
          where: {
            policyId,
            type: "DOCS_GENERATED",
          },
          select: {
            id: true,
          },
        });

      if (!docsGeneratedEvent) {
        await transaction.policyEvent.create({
          data: {
            policyId,
            type: "DOCS_GENERATED",
            data: {
              proposalUrl,
              certificateUrl,
            },
          },
        });
      }
    });
  }

  /*
   * Always ensure a successfully fulfilled policy is ACTIVE, including
   * webhook retries where the PDFs already existed.
   */
  if (policy.status !== "ACTIVE") {
    await prisma.policy.update({
      where: {
        id: policyId,
      },
      data: {
        status: "ACTIVE",
      },
    });
  }

  /*
   * Atomically claim the initial policy email before calling Resend.
   *
   * The partial unique database index permits only one EMAIL_SENT event
   * with source INITIAL_FULFILLMENT for each policy.
   *
   * Customer-requested retrieval emails remain repeatable because they
   * do not use source INITIAL_FULFILLMENT.
   */
  let initialEmailClaimed = false;

  try {
    await prisma.policyEvent.create({
      data: {
        policyId,
        type: "EMAIL_SENT",
        data: {
          source: "INITIAL_FULFILLMENT",
          status: "PROCESSING",
          to: policy.email,
        },
      },
    });

    initialEmailClaimed = true;
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      console.log("[policy email] already claimed", {
        policyId,
        email: policy.email,
      });
    } else {
      throw error;
    }
  }

  if (initialEmailClaimed) {
    try {
      const emailResult = await sendPolicyEmail({
        to: policy.email,
        policyNumber: policy.policyNumber,
        certificateUrl,
        proposalUrl,

        vrm: policy.vrm,
        make: policy.make ?? null,
        model: policy.model ?? null,
        year: policy.year ?? null,
        startAtISO: policy.startAt.toISOString(),
        endAtISO: policy.endAt.toISOString(),
      });

      await prisma.policyEvent.updateMany({
        where: {
          policyId,
          type: "EMAIL_SENT",
          data: {
            path: ["source"],
            equals: "INITIAL_FULFILLMENT",
          },
        },
        data: {
          data: {
            source: "INITIAL_FULFILLMENT",
            status: "COMPLETED",
            ok: true,
            to: policy.email,
            messageId: emailResult?.id ?? null,
          },
        },
      });
    } catch (error: unknown) {
      await prisma.policyEvent.deleteMany({
        where: {
          policyId,
          type: "EMAIL_SENT",
          data: {
            path: ["source"],
            equals: "INITIAL_FULFILLMENT",
          },
        },
      });

      console.error(
        "[policy email] send failed; claim removed",
        {
          policyId,
          email: policy.email,
          error: getErrorMessage(error),
        }
      );

      throw error;
    }
  }

  /*
   * Atomically claim newsletter processing before calling Resend.
   *
   * The database partial unique index allows only one
   * NEWSLETTER_CONTACT_ADDED row for each policy.
   *
   * Concurrent fulfilment requests receive Prisma P2002 and do not
   * call Resend again.
   */
  let newsletterClaimed = false;

  try {
    await prisma.policyEvent.create({
      data: {
        policyId,
        type: "NEWSLETTER_CONTACT_ADDED",
        data: {
          status: "PROCESSING",
          email: policy.email,
        },
      },
    });

    newsletterClaimed = true;
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      console.log("[resend contacts] already claimed", {
        policyId,
        email: policy.email,
      });
    } else {
      throw error;
    }
  }

  if (newsletterClaimed) {
    const newsletterResult =
      await syncCustomerToNewsletter({
        email: policy.email,
        fullName: policy.fullName,
      });

    const newsletterWasSkipped =
      "skipped" in newsletterResult &&
      newsletterResult.skipped === true;

    if (newsletterResult.ok || newsletterWasSkipped) {
      await prisma.policyEvent.updateMany({
        where: {
          policyId,
          type: "NEWSLETTER_CONTACT_ADDED",
        },
        data: {
          data: {
            status: "COMPLETED",
            ok: newsletterResult.ok,
            email: policy.email,
            skipped: newsletterWasSkipped,
          },
        },
      });
    } else {
      /*
       * Resend did not complete the operation.
       * Remove the claim so a future retry can attempt it again.
       */
      await prisma.policyEvent.deleteMany({
        where: {
          policyId,
          type: "NEWSLETTER_CONTACT_ADDED",
        },
      });

      console.error(
        "[resend contacts] sync failed; claim removed",
        {
          policyId,
          email: policy.email,
        }
      );
    }
  }

  /*
   * Atomically claim the welcome automation before calling Resend.
   *
   * The database partial unique index allows only one
   * WELCOME_AUTOMATION_TRIGGERED row for each policy.
   *
   * Even if Square sends payment.created, payment.updated, or retries
   * the same webhook concurrently, only the request that creates this
   * claim is allowed to trigger the Resend event.
   */
  let welcomeClaimed = false;

  try {
    await prisma.policyEvent.create({
      data: {
        policyId,
        type: "WELCOME_AUTOMATION_TRIGGERED",
        data: {
          status: "PROCESSING",
          email: policy.email,
        },
      },
    });

    welcomeClaimed = true;
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      console.log("[resend welcome] already claimed", {
        policyId,
        email: policy.email,
      });
    } else {
      throw error;
    }
  }

  if (welcomeClaimed) {
    const welcomeResult =
      await triggerWelcomeAutomation({
        email: policy.email,
        fullName: policy.fullName,
        policyNumber: policy.policyNumber,
      });

    const welcomeWasSkipped =
      "skipped" in welcomeResult &&
      welcomeResult.skipped === true;

    if (welcomeResult.ok || welcomeWasSkipped) {
      await prisma.policyEvent.updateMany({
        where: {
          policyId,
          type: "WELCOME_AUTOMATION_TRIGGERED",
        },
        data: {
          data: {
            status: "COMPLETED",
            ok: welcomeResult.ok,
            email: policy.email,
            eventId:
              "eventId" in welcomeResult
                ? welcomeResult.eventId
                : null,
            skipped: welcomeWasSkipped,
          },
        },
      });
    } else {
      /*
       * Resend did not confirm that the automation event was accepted.
       * Remove the claim so a future retry can attempt it again.
       */
      await prisma.policyEvent.deleteMany({
        where: {
          policyId,
          type: "WELCOME_AUTOMATION_TRIGGERED",
        },
      });

      console.error(
        "[resend welcome] trigger failed; claim removed",
        {
          policyId,
          email: policy.email,
        }
      );
    }
  }

  return {
    proposalUrl,
    certificateUrl,
    policyNumber: policy.policyNumber,
    email: policy.email,
  };
}