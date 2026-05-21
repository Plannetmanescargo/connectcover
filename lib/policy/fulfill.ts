// lib/policy/fulfill.ts
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

    // Keep your current certificate number style
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

    // Write document rows + status update + docs generated event
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

      // Optional richer email content (supported by your upgraded sendPolicyEmail.ts)
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

  // ✅ Always return an object
  return {
    proposalUrl,
    certificateUrl,
    policyNumber: policy.policyNumber,
    email: policy.email,
  };
}