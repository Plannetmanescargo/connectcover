import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Body = {
  policyNumber?: string;
  vrm?: string;
  email?: string;
};

function normEmail(v: string)        { return v.trim().toLowerCase(); }
function normPolicyNumber(v: string) { return v.trim().toUpperCase().replace(/\s+/g, ""); }
function normVrm(v: string)          { return v.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""); }

async function getSignedUrl(storageKey: string, url: string | null): Promise<string | null> {
  if (storageKey) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.storage
      .from("policy-documents")
      .createSignedUrl(storageKey, 60 * 10); // 10 minutes
    if (error) return null;
    return data.signedUrl;
  }
  return url ?? null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body) return NextResponse.json({ ok: false }, { status: 200 });

    const hasVrmEmail    = body.vrm && body.email;
    const hasPolicyEmail = body.policyNumber && body.email;
    const hasPolicyOnly  = body.policyNumber && !body.email;

    if (!hasVrmEmail && !hasPolicyEmail && !hasPolicyOnly) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // Find policy
    let policy = null;

    if (hasVrmEmail) {
      // Lookup by VRM + email — find most recent active policy for this vrm/email combo
      policy = await prisma.policy.findFirst({
        where: {
          vrm:   normVrm(body.vrm!),
          email: normEmail(body.email!),
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, policyNumber: true, email: true, status: true,
          vrm: true, make: true, model: true, year: true,
          startAt: true, endAt: true,
          documents: { select: { kind: true, storageKey: true, url: true } },
        },
      });
    } else if (hasPolicyEmail) {
      // Lookup by policy number + email
      policy = await prisma.policy.findUnique({
        where: { policyNumber: normPolicyNumber(body.policyNumber!) },
        select: {
          id: true, policyNumber: true, email: true, status: true,
          vrm: true, make: true, model: true, year: true,
          startAt: true, endAt: true,
          documents: { select: { kind: true, storageKey: true, url: true } },
        },
      });
      // Verify email matches
      if (policy && normEmail(policy.email) !== normEmail(body.email!)) {
        return NextResponse.json({ ok: false }, { status: 200 });
      }
    } else if (hasPolicyOnly) {
      // Policy number only — no email verification (less secure, keep as fallback)
      policy = await prisma.policy.findUnique({
        where: { policyNumber: normPolicyNumber(body.policyNumber!) },
        select: {
          id: true, policyNumber: true, email: true, status: true,
          vrm: true, make: true, model: true, year: true,
          startAt: true, endAt: true,
          documents: { select: { kind: true, storageKey: true, url: true } },
        },
      });
    }

    if (!policy) return NextResponse.json({ ok: false }, { status: 200 });

    // Get document URLs
    const cert     = policy.documents.find(d => d.kind === "CERTIFICATE");
    const proposal = policy.documents.find(d => d.kind === "PROPOSAL");

    const certificateUrl = cert
      ? await getSignedUrl(cert.storageKey ?? "", cert.url)
      : null;

    const proposalUrl = proposal
      ? await getSignedUrl(proposal.storageKey ?? "", proposal.url)
      : null;

    return NextResponse.json({
      ok: true,
      policy: {
        policyNumber:   policy.policyNumber,
        status:         policy.status,
        vrm:            policy.vrm,
        make:           policy.make,
        model:          policy.model,
        year:           policy.year,
        startAt:        policy.startAt,
        endAt:          policy.endAt,
        email:          policy.email,
        certificateUrl,
        proposalUrl,
      },
    }, { status: 200 });

  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}