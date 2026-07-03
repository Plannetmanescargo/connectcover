// lib/policy/fulfill.ts
import { Resend } from "resend";
import { prisma } from "@/db/prisma";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendPolicyEmail } from "@/lib/email/sendPolicyEmail";

export type FulfillResult = {
  proposalUrl: string;
  certificateUrl: string;
  policyNumber: string;
  email: string;
};

function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

/**
 * Server-safe site URL resolver.
 * ✅ Uses SITE_URL first (recommended)
 * ✅ Falls back to NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_BASE_URL if you already have them
 * ✅ Only falls back to localhost in dev
 * ❌ Never silently uses localhost in production
 */
function getSiteUrl() {
  const raw =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL;

  if (raw && raw.trim()) return stripTrailingSlash(raw.trim());

  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";

  throw new Error(
    "Missing SITE_URL env var. Set SITE_URL=https://www.coverza.co.uk in Vercel (Production + Preview)."
  );
}

async function renderPdf(path: string, payload: any): Promise<Buffer> {
  const base = getSiteUrl();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-key": process.env.INTERNAL_RENDER_KEY || "",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Render failed ${path} (${res.status}): ${t}`);
    }

    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "Render timed out" : e?.message ?? String(e);
    throw new Error(`Render request failed ${path}: ${msg}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function uploadPdf(bucket: string, key: string, pdf: Buffer) {
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin.storage.from(bucket).upload(key, pdf, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(key);
  return data.publicUrl;
}

async function syncCustomerToNewsletter(policy: {
  email: string;
  fullName: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const segmentId = process.env.RESEND_NEWSLETTER_SEGMENT_ID?.trim();
  const weeklyTopicId = process.env.RESEND_WEEKLY_TOPIC_ID?.trim();
  const monthlyTopicId = process.env.RESEND_MONTHLY_TOPIC_ID?.trim();

  if (!apiKey || !segmentId || !weeklyTopicId || !monthlyTopicId) {
    console.warn(
      "[resend contacts] skipped - missing RESEND_API_KEY, RESEND_NEWSLETTER_SEGMENT_ID, RESEND_WEEKLY_TOPIC_ID, or RESEND_MONTHLY_TOPIC_ID"
    );
    return { ok: false as const, skipped: true as const };
  }

  const resend = new Resend(apiKey);

  const fullName = (policy.fullName || "").trim();
  const firstName = fullName.split(" ")[0] ?? "";
  const lastName = fullName.split(" ").slice(1).join(" ") ?? "";

  try {
    // 1) Create contact if it does not already exist
    const created = await (resend.contacts as any).create({
      email: policy.email,
      firstName,
      lastName,
      unsubscribed: false,
    });

    if (created?.error) {
      const msg = String(created.error.message || "");

      // allow existing contact to continue through the rest of the sync
      if (
        !msg.toLowerCase().includes("already exists") &&
        !msg.toLowerCase().includes("duplicate")
      ) {
        throw new Error(msg || "Failed to create contact");
      }
    }

    // 2) Ensure unsubscribed flag is false
    const updated = await (resend.contacts as any).update({
      email: policy.email,
      unsubscribed: false,
      firstName,
      lastName,
    });

    if (updated?.error) {
      throw new Error(updated.error.message || "Failed to update contact");
    }

    // 3) Add contact to the newsletter segment
    const seg = await ((resend.contacts as any).segments as any).add({
      email: policy.email,
      segmentId,
    });

    if (seg?.error) {
      throw new Error(seg.error.message || "Failed to add contact to segment");
    }

    // 4) Subscribe contact to both newsletter topics
    const topics = await ((resend.contacts as any).topics as any).update({
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

    if (topics?.error) {
      throw new Error(topics.error.message || "Failed to subscribe contact to topics");
    }

    return { ok: true as const };
  } catch (e: any) {
    console.error("[resend contacts] failed to sync contact", {
      email: policy.email,
      error: e,
    });
    return { ok: false as const };
  }
}

export async function fulfillPolicy(policyId: string): Promise<FulfillResult> {
  const policy = await prisma.policy.findUnique({
    where: { id: policyId },
    include: { documents: true },
  });
  if (!policy) throw new Error("Policy not found");

  // Check if we have docs already
  const existingProposal =
    policy.documents.find((d) => d.kind === "PROPOSAL")?.url || null;
  const existingCert =
    policy.documents.find((d) => d.kind === "CERTIFICATE")?.url || null;

  let proposalUrl = existingProposal ?? "";
  let certificateUrl = existingCert ?? "";

  // If docs are missing, generate + upload + write rows
  if (!(existingProposal && existingCert)) {
    const baseUrl = getSiteUrl();

    const proposalPayload = {
      policyNumber: policy.policyNumber,
      createdAtISO: policy.createdAt.toISOString(),

      vrm: policy.vrm,
      make: policy.make ?? null,
      model: policy.model ?? null,
      year: policy.year ?? null,
      startAtISO: policy.startAt.toISOString(),
      endAtISO: policy.endAt.toISOString(),
      durationMs: Number(policy.durationMs), // safe for <= 1 year

      fullName: policy.fullName,
      dobISO: policy.dob.toISOString().slice(0, 10),
      email: policy.email,
      address: policy.address,
      licenceType: policy.licenceType,

      issuedBy: "Accelerant",
      baseUrl,
      signatureUrl: "/brand/signature.png",
    };

    const certificateNumber = `${policy.policyNumber}`;

    const certificatePayload = {
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
    const certPdf = await renderPdf(
      "/api/internal/policy/render-certificate",
      certificatePayload
    );

    const bucket = "policy-documents";
    const baseKey = `policies/${policy.policyNumber}`;

    const proposalKey = `${baseKey}/proposal-${policy.policyNumber}.pdf`;
    const certKey = `${baseKey}/certificate-${certificateNumber}.pdf`;

    proposalUrl = await uploadPdf(bucket, proposalKey, proposalPdf);
    certificateUrl = await uploadPdf(bucket, certKey, certPdf);

    await prisma.$transaction(async (tx) => {
      const docs = await tx.policyDocument.findMany({ where: { policyId } });

      const hasProposal = docs.some((d) => d.kind === "PROPOSAL");
      const hasCert = docs.some((d) => d.kind === "CERTIFICATE");

      if (!hasProposal) {
        await tx.policyDocument.create({
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

      if (!hasCert) {
        await tx.policyDocument.create({
          data: {
            policyId,
            kind: "CERTIFICATE",
            filename: `certificate-${certificateNumber}.pdf`,
            storageProvider: "SUPABASE",
            storageKey: certKey,
            url: certificateUrl,
          },
        });
      }

      await tx.policy.update({
        where: { id: policyId },
        data: { status: "ACTIVE" },
      });

      await tx.policyEvent.create({
        data: {
          policyId,
          type: "DOCS_GENERATED",
          data: { proposalUrl, certificateUrl },
        },
      });
    });
  }

  // --- EMAIL STEP (idempotent-ish) ---
  const alreadyEmailed = await prisma.policyEvent.findFirst({
    where: { policyId, type: "EMAIL_SENT" },
    select: { id: true },
  });

  if (!alreadyEmailed) {
    const emailRes = await sendPolicyEmail({
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

    try {
      await prisma.policyEvent.create({
        data: {
          policyId,
          type: "EMAIL_SENT",
          data: {
            ok: true,
            to: policy.email,
            messageId: emailRes?.id ?? null,
          },
        },
      });
    } catch {
      // ignore
    }
  }

  // --- NEWSLETTER SYNC STEP (non-blocking + idempotent-ish) ---
  const alreadyAddedToAudience = await prisma.policyEvent.findFirst({
    where: { policyId, type: "NEWSLETTER_CONTACT_ADDED" },
    select: { id: true },
  });

  if (!alreadyAddedToAudience) {
    const newsletterRes = await syncCustomerToNewsletter({
      email: policy.email,
      fullName: policy.fullName,
    });

    if (newsletterRes.ok || ("skipped" in newsletterRes && newsletterRes.skipped)) {
      try {
        await prisma.policyEvent.create({
          data: {
            policyId,
            type: "NEWSLETTER_CONTACT_ADDED",
            data: {
              ok: newsletterRes.ok,
              email: policy.email,
              skipped: "skipped" in newsletterRes ? !!newsletterRes.skipped : false,
            },
          },
        });
      } catch {
        // ignore
      }
    }
  }

  return {
    proposalUrl,
    certificateUrl,
    policyNumber: policy.policyNumber,
    email: policy.email,
  };
}