import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;
    const replyTo = process.env.RESEND_REPLY_TO;

    if (!apiKey) return NextResponse.json({ ok: false, error: "Missing RESEND_API_KEY" }, { status: 500 });
    if (!from) return NextResponse.json({ ok: false, error: "Missing RESEND_FROM" }, { status: 500 });

    const body = (await req.json().catch(() => null)) as { to?: string } | null;
    const to = body?.to?.trim();

    if (!to) {
      return NextResponse.json(
        { ok: false, error: "Missing `to` in JSON body. Example: {\"to\":\"you@gmail.com\"}" },
        { status: 400 }
      );
    }

    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from,
      to,
      replyTo: replyTo || undefined,
      subject: "Coverza — Resend test",
      html: `<div style="font-family:Arial,sans-serif">
        <h2>Resend test ✅</h2>
        <p>If you can read this, sending is working.</p>
      </div>`,
    });

    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
