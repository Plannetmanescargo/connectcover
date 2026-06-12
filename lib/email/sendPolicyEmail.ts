// lib/email/sendPolicyEmail.ts
import { Resend } from "resend";

type SendPolicyEmailInput = {
  to: string;
  policyNumber: string;
  certificateUrl: string;
  proposalUrl: string;
  vrm?: string | null;
  make?: string | null;
  model?: string | null;
  year?: string | null;
  startAtISO?: string | null;
  endAtISO?: string | null;
};

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing ${name}`);
  return v.trim();
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isHttpUrl(s: string) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function cleanPdfUrl(url: string, label: string) {
  if (!url || !isHttpUrl(url)) throw new Error(`${label} must be a valid http(s) URL`);
  if (!/\.pdf(\?|#|$)/i.test(url)) throw new Error(`${label} must point to a .pdf`);
  return url;
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmtDateTime(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function vehicleLine(input: SendPolicyEmailInput) {
  const vrm  = (input.vrm  || "").trim();
  const mm   = [input.make, input.model].filter(Boolean).join(" ").trim();
  const year = (input.year || "").trim();
  const parts = [vrm || null, mm || null, year ? `(${year})` : null].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

export async function sendPolicyEmail(input: SendPolicyEmailInput) {
  const apiKey  = requireEnv("RESEND_API_KEY");
  const from    = requireEnv("RESEND_FROM");
  const replyTo = (process.env.RESEND_REPLY_TO || "").trim();

  if (!input?.policyNumber?.trim()) throw new Error("policyNumber is required");
  if (!input?.to?.trim() || !validEmail(input.to)) throw new Error("to must be a valid email");

  const certificateUrl = cleanPdfUrl(input.certificateUrl, "certificateUrl");
  const proposalUrl    = cleanPdfUrl(input.proposalUrl,    "proposalUrl");

  const brandName    = "Coverza";
  const brandColour  = "#6c4cf3";
  const supportEmail = replyTo || "support@coverza.co.uk";
  const policyNumber = input.policyNumber.trim();

  const veh   = vehicleLine(input);
  const start = fmtDateTime(input.startAtISO);
  const end   = fmtDateTime(input.endAtISO);

  const subject = `Cover confirmed — Policy ${policyNumber}`;

  /* ── Plain text ─────────────────────────────────────── */
  const textLines: string[] = [
    `${brandName} — Cover confirmed`,
    "",
    `Policy number: ${policyNumber}`,
  ];
  if (veh)          textLines.push(`Insured vehicle: ${veh}`);
  if (start && end) textLines.push(`Period of cover: ${start} → ${end}`);
  textLines.push(
    "",
    "Your policy documents are attached to this email:",
    "• Certificate of Motor Insurance (PDF)",
    "• Statement of Fact & Declaration (PDF)",
    "",
    "Quick links (if you cannot open attachments):",
    `• Certificate: ${certificateUrl}`,
    `• Statement of Fact: ${proposalUrl}`,
    "",
    "Next steps:",
    "1) Review your Certificate and Statement of Fact carefully.",
    "2) Save the PDFs to your device and keep the Certificate accessible while driving.",
    "3) If any detail is incorrect, contact us immediately before driving.",
    "",
    "Motor Insurance Database (MID):",
    "MID records update several times daily. Allow a few hours for your cover to appear after purchase.",
    "Your Certificate is legal evidence of cover if asked for proof.",
    "",
    `Questions? Reply to this email or contact ${supportEmail}.`,
    "",
    "Regulatory & legal information:",
    "We hereby certify that the policy satisfies the requirements of the relevant law applicable in Great Britain, Northern Ireland, the Isle of Man, and the islands of Alderney, Guernsey and Jersey.",
    "",
    "Coverza Limited is authorised by the Gibraltar Financial Services Commission to carry on insurance business under the Financial Services Act 2019 and Financial Services Regulations 2020, registered address 5/5 Crutchett's Ramp, Gibraltar.",
    "Details about our regulation by the Financial Conduct Authority and Prudential Regulation Authority are available on request.",
    "",
    "Registered in England and Wales as ACCELERANT INSURANCE UK LIMITED. Reg. No. 03326800. Registered Address: One, Fleet Place, London, England, EC4M 7WS. Authorised and regulated by the Financial Conduct Authority (207658).",
    "",
    "Confidentiality notice:",
    "The content of this email is confidential and intended only for the recipient specified. It is strictly forbidden to share any part of this message with any third party without the written consent of the sender.",
    "If you received this message by mistake, please reply to this email and delete it.",
    "",
    `— ${brandName}`,
  );
  const text = textLines.join("\n");

  /* ── Escaped values ─────────────────────────────────── */
  const safePolicy  = escapeHtml(policyNumber);
  const safeVeh     = veh   ? escapeHtml(veh)   : null;
  const safeStart   = start ? escapeHtml(start) : null;
  const safeEnd     = end   ? escapeHtml(end)   : null;
  const safeSupport = escapeHtml(supportEmail);
  const safeCertUrl = escapeHtml(certificateUrl);
  const safePropUrl = escapeHtml(proposalUrl);
  const safeBrand   = escapeHtml(brandName);

  /* ── HTML ───────────────────────────────────────────── */
  const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${safeBrand} — Policy ${safePolicy}</title>
  </head>

  <body style="margin:0;padding:0;background:#f0edff;">

    <!-- Preview text -->
    <div style="display:none;font-size:1px;color:#f0edff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      Your Coverza policy is confirmed — ${safePolicy}. Your documents are attached and ready to download.&#847;&zwnj;
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0edff;">
      <tr>
        <td align="center" style="padding:32px 14px 44px 14px;">
          <table role="presentation" width="580" cellpadding="0" cellspacing="0" border="0" style="width:580px;max-width:100%;">

            <!-- ══ HEADER ══ -->
            <tr>
              <td style="padding:0 4px 18px 4px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <!-- Wordmark -->
                      <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#6c4cf3;font-size:24px;font-weight:900;letter-spacing:-0.8px;line-height:1;text-decoration:none;">
                        ${safeBrand}
                      </span>
                      <div style="margin-top:4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#7c6baa;font-size:11.5px;line-height:1;">
                        Coverage that connects
                      </div>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <div style="display:inline-block;background:rgba(108,76,243,0.08);border:1px solid rgba(108,76,243,0.20);border-radius:999px;padding:7px 13px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;color:#5b45b8;line-height:1;">
                        Policy&nbsp;<span style="color:#1a0f3a;font-weight:900;">${safePolicy}</span>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- ══ MAIN CARD ══ -->
            <tr>
              <td style="background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 20px 60px rgba(108,76,243,0.10),0 2px 8px rgba(15,23,42,0.05);">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                  <!-- Hero band — deep purple gradient -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#6c4cf3 0%,#5038d0 100%);padding:32px 30px 30px 30px;">

                      <!-- Confirmed pill -->
                      <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.28);border-radius:999px;padding:6px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11.5px;font-weight:800;color:#ffffff;letter-spacing:0.02em;line-height:1;">
                        ✓&nbsp;&nbsp;Cover confirmed
                      </div>

                      <!-- Headline -->
                      <h1 style="margin:14px 0 8px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;font-size:32px;font-weight:900;letter-spacing:-1.1px;line-height:1.06;">
                        You're covered.
                      </h1>

                      <!-- Sub -->
                      <p style="margin:0;max-width:420px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:rgba(255,255,255,0.78);font-size:14.5px;line-height:1.65;">
                        Your temporary insurance policy is in force. Documents are attached and available through the links below.
                      </p>

                      <!-- Policy / vehicle / period chips -->
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
                        <tr>
                          <td style="padding-right:8px;vertical-align:top;">
                            <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.20);border-radius:12px;padding:10px 13px;">
                              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:rgba(255,255,255,0.55);font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.10em;margin-bottom:4px;">
                                Policy
                              </div>
                              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;font-size:13px;font-weight:900;letter-spacing:-0.2px;">
                                ${safePolicy}
                              </div>
                            </div>
                          </td>

                          ${safeVeh ? `
                          <td style="padding-right:8px;vertical-align:top;">
                            <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.20);border-radius:12px;padding:10px 13px;">
                              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:rgba(255,255,255,0.55);font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.10em;margin-bottom:4px;">
                                Vehicle
                              </div>
                              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;font-size:13px;font-weight:900;letter-spacing:-0.2px;">
                                ${safeVeh}
                              </div>
                            </div>
                          </td>
                          ` : ""}

                          ${safeStart && safeEnd ? `
                          <td style="vertical-align:top;">
                            <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.20);border-radius:12px;padding:10px 13px;">
                              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:rgba(255,255,255,0.55);font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.10em;margin-bottom:4px;">
                                Cover period
                              </div>
                              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;font-size:12px;font-weight:800;line-height:1.45;">
                                ${safeStart}<br />
                                <span style="color:rgba(255,255,255,0.55);font-size:10px;font-weight:600;">to</span><br />
                                ${safeEnd}
                              </div>
                            </div>
                          </td>
                          ` : ""}
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- White divider line -->
                  <tr>
                    <td style="background:#ffffff;height:1px;line-height:1px;font-size:1px;">&nbsp;</td>
                  </tr>

                  <!-- Documents section -->
                  <tr>
                    <td style="background:#ffffff;padding:26px 30px 10px 30px;">
                      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a0f3a;font-size:14px;font-weight:900;margin-bottom:13px;letter-spacing:-0.1px;">
                        Your documents
                      </div>

                      <!-- Primary CTA — certificate -->
                      <a href="${safeCertUrl}"
                        style="display:block;text-decoration:none;background:#6c4cf3;border-radius:14px;padding:15px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;font-size:14px;font-weight:800;text-align:center;box-shadow:0 8px 24px rgba(108,76,243,0.24);letter-spacing:-0.1px;">
                        Download certificate of insurance
                      </a>

                      <div style="height:8px;line-height:8px;font-size:8px;">&nbsp;</div>

                      <!-- Secondary CTA — statement -->
                      <a href="${safePropUrl}"
                        style="display:block;text-decoration:none;background:#faf9ff;border:1.5px solid #ddd5fc;border-radius:14px;padding:14px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#4a3a9e;font-size:14px;font-weight:800;text-align:center;letter-spacing:-0.1px;">
                        View statement of fact &amp; declaration
                      </a>

                      <p style="margin:10px 0 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#9ca3af;font-size:12px;line-height:1.6;">
                        Both documents are also attached to this email as PDFs.
                      </p>
                    </td>
                  </tr>

                  <!-- Three steps row -->
                  <tr>
                    <td style="background:#ffffff;padding:16px 30px 0 30px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                        style="background:#faf9ff;border:1.5px solid #ede8ff;border-radius:18px;">
                        <tr>
                          <td style="padding:16px 18px;">
                            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a0f3a;font-size:12.5px;font-weight:900;margin-bottom:10px;">
                              What happens next
                            </div>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              ${["Review your certificate and statement carefully — check all details are correct.",
                                 "Save both PDFs to your device and keep the certificate accessible while driving.",
                                 "If any detail is wrong, contact us <strong style=\"color:#6c4cf3;\">before</strong> driving."].map((step, i) => `
                              <tr>
                                <td style="vertical-align:top;padding-bottom:${i < 2 ? "8" : "0"}px;">
                                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                      <td style="vertical-align:top;padding-right:10px;">
                                        <div style="width:20px;height:20px;background:#6c4cf3;border-radius:999px;text-align:center;line-height:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;font-size:10px;font-weight:900;">
                                          ${i + 1}
                                        </div>
                                      </td>
                                      <td style="vertical-align:middle;">
                                        <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#374151;font-size:12.5px;line-height:1.5;">${step}</span>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>`).join("")}
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- MID notice -->
                  <tr>
                    <td style="background:#ffffff;padding:12px 30px 0 30px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                        style="background:#f9fafb;border:1px solid #e9eaeb;border-radius:14px;">
                        <tr>
                          <td style="padding:13px 16px;">
                            <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#374151;font-size:12px;font-weight:900;">MID records</span>
                            <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#6b7280;font-size:12px;line-height:1.6;">
                              &nbsp;update several times daily. Please allow a few hours for your cover to appear. Your certificate is legal proof of insurance if asked.
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Help line -->
                  <tr>
                    <td style="background:#ffffff;padding:18px 30px 28px 30px;text-align:center;">
                      <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#6b7280;font-size:13px;line-height:1.7;">
                        Questions or concerns? Reply to this email or contact
                        <a href="mailto:${safeSupport}" style="color:#6c4cf3;font-weight:800;text-decoration:none;">${safeSupport}</a>.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>

            <!-- ══ FOOTER ══ -->
            <tr>
              <td style="padding:20px 4px 0 4px;">

                <p style="margin:0 0 14px 0;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#9ca3af;font-size:11px;line-height:1.6;">
                  ${safeBrand} · Policy ${safePolicy} ·
                  <a href="mailto:${safeSupport}" style="color:#7c6baa;text-decoration:none;">${safeSupport}</a>
                </p>

                <!-- Regulatory -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                  style="background:#ffffff;border:1px solid #e9eaeb;border-radius:16px;margin-bottom:10px;">
                  <tr>
                    <td style="padding:14px 18px;">
                      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#374151;font-size:11.5px;font-weight:900;margin-bottom:6px;">
                        Regulatory &amp; legal information
                      </div>
                      <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#6b7280;font-size:10.5px;line-height:1.65;">
                        We hereby certify that the policy satisfies the requirements of the relevant law applicable in Great Britain, Northern Ireland, the Isle of Man, and the islands of Alderney, Guernsey and Jersey.
                        <br /><br />
                        Coverza Limited is authorised by the Gibraltar Financial Services Commission to carry on insurance business under the Financial Services Act 2019 and Financial Services Regulations 2020, registered address 5/5 Crutchett's Ramp, Gibraltar. Details about our regulation by the Financial Conduct Authority and Prudential Regulation Authority are available on request.
                        <br /><br />
                        Registered in England and Wales as <strong style="color:#4b5563;">ACCELERANT INSURANCE UK LIMITED</strong>. Reg. No. 03326800. Registered Address: One, Fleet Place, London, England, EC4M 7WS. Authorised and regulated by the Financial Conduct Authority (207658).
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Confidentiality -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                  style="background:#ffffff;border:1px solid #e9eaeb;border-radius:16px;">
                  <tr>
                    <td style="padding:14px 18px;">
                      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#374151;font-size:11.5px;font-weight:900;margin-bottom:6px;">
                        Confidentiality notice
                      </div>
                      <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#6b7280;font-size:10.5px;line-height:1.65;">
                        The content of this email is confidential and intended only for the recipient specified. It is strictly forbidden to share any part of this message with any third party without the written consent of the sender. If you received this message by mistake, please reply to this email and delete it so we can help prevent this happening again.
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();

  const resend = new Resend(apiKey);

  const res = await resend.emails.send({
    from,
    to: input.to,
    subject,
    ...(replyTo ? { replyTo } : {}),
    text,
    html,
    attachments: [
      {
        filename: `coverza-certificate-${policyNumber}.pdf`,
        path: certificateUrl,
      },
      {
        filename: `coverza-statement-of-fact-${policyNumber}.pdf`,
        path: proposalUrl,
      },
    ],
  });

  if (res.error) {
    console.error("[sendPolicyEmail] Resend error", res.error);
    throw new Error(res.error.message || "Resend failed to send email");
  }

  return { ok: true as const, id: res.data?.id ?? null };
}