// app/api/internal/policy/render-certificate/route.ts
import { NextResponse } from "next/server";
import {
  renderCertificatePdf,
  type CertificatePdfInput,
} from "@/lib/policy/certificate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBaseUrl(req: Request) {
  const url = new URL(req.url);
  const host = req.headers.get("host") ?? url.host;
  const proto =
    req.headers.get("x-forwarded-proto") ??
    url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  try {
        const key = req.headers.get("x-internal-key");
if (!process.env.INTERNAL_RENDER_KEY || key !== process.env.INTERNAL_RENDER_KEY) {
  return new Response("Unauthorized", { status: 401 });
}

    const body = (await req.json().catch(() => null)) as
      | Partial<CertificatePdfInput>
      | null;

    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON" },
        { status: 400 }
      );
    }


    const baseUrl = body.baseUrl || getBaseUrl(req);

    const input: CertificatePdfInput = {
      certificateNumber: String(
        body.certificateNumber || "CVZ-CERT-TEST-0001"
      ),

      policyNumber: body.policyNumber
        ? String(body.policyNumber)
        : undefined,

      vrm: String(body.vrm || "AB12CDE"),
      make: body.make ?? null,
      model: body.model ?? null,
      year: body.year ?? null,

      // ✅ Correct field name
      policyholderName: String(
        body.policyholderName || "Test Policyholder"
      ),

      startAtISO: String(
        body.startAtISO || new Date().toISOString()
      ),
      endAtISO: String(
        body.endAtISO ||
          new Date(Date.now() + 24 * 3600_000).toISOString()
      ),

      baseUrl,

      // ✅ FORCE DEFAULT SIGNATURE
      // Uses /public/brand/signature.png automatically
      signatureUrl: body.signatureUrl ?? "/brand/signature.png",
    };

    const pdf = await renderCertificatePdf(input);

    // Buffer → Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificate-${input.certificateNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Render failed",
        message: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}
