// app/api/internal/policy/render-proposal/route.ts
import { NextResponse } from "next/server";
import {
  renderProposalPdf,
  type ProposalPdfInput,
} from "@/lib/policy/docs";

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
      | Partial<ProposalPdfInput>
      | null;

    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON" },
        { status: 400 }
      );
    }



    // Required so @react-pdf can load /public assets
    const baseUrl = body.baseUrl || getBaseUrl(req);

    const input: ProposalPdfInput = {
      policyNumber: String(body.policyNumber || "CVZ-TEST-0000"),
      createdAtISO: body.createdAtISO
        ? String(body.createdAtISO)
        : new Date().toISOString(),

      vrm: String(body.vrm || "AB12CDE"),
      make: body.make ?? null,
      model: body.model ?? null,
      year: body.year ?? null,
      startAtISO: String(body.startAtISO || new Date().toISOString()),
      endAtISO: String(
        body.endAtISO ||
          new Date(Date.now() + 6 * 3600_000).toISOString()
      ),
      durationMs: Number(body.durationMs || 6 * 3600_000),

      fullName: String(body.fullName || "Test Driver"),
      dobISO: String(body.dobISO || "2001-05-28"),
      email: String(body.email || "test@example.com"),
      address: String(
        body.address || "22 Millais Road, London, E11 4HD"
      ),
      licenceType: String(body.licenceType || "UK"),

      issuedBy: body.issuedBy
        ? String(body.issuedBy)
        : "Accelerant",

      baseUrl,

      // ✅ FORCE DEFAULT SIGNATURE
      signatureUrl: body.signatureUrl ?? "/brand/signature.png",
    };

    const pdf = await renderProposalPdf(input);

    // Buffer → Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="proposal-${input.policyNumber}.pdf"`,
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
