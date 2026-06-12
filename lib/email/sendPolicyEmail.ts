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
  if (start && end) textLines.push(`Period of cover: ${start} — ${end}`);
  textLines.push(
    "",
    "Your policy documents are attached to this email:",
    "* Certificate of Motor Insurance (PDF)",
    "* Statement of Fact & Declaration (PDF)",
    "",
    "Quick links if you cannot open the attachments:",
    `* Certificate: ${certificateUrl}`,
    `* Statement of Fact: ${proposalUrl}`,
    "",
    "Next steps:",
    "1) Review your Certificate and Statement of Fact carefully.",
    "2) Save the PDFs to your device and keep the Certificate accessible while driving.",
    "3) If any detail is incorrect, contact us immediately before driving.",
    "",
    "Motor Insurance Database (MID):",
    "MID records update several times daily. Allow a few hours for your cover to appear.",
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
    "The content of this email is confidential and intended only for the recipient specified.",
    "If you received this message by mistake, please reply and delete it.",
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

  /*
   * EMAIL CLIENT COMPATIBILITY NOTES
   * ─────────────────────────────────
   * Outlook (Word engine): no CSS gradients, no border-radius on <td>,
   *   no background shorthand. Fix: bgcolor attr + VML for coloured bands.
   * Gmail: strips <style> blocks, ignores gradients. Fix: bgcolor + inline bg.
   * Apple Mail / iOS: full CSS support — looks best here.
   * Samsung Mail: treat like Gmail.
   *
   * Strategy for the purple hero band:
   *   1. bgcolor="#6c4cf3" on the <td> — universal table attribute, all clients
   *   2. style="background:#6c4cf3" — modern clients
   *   3. VML <!--[if gte mso 9]> wrapper — Outlook-specific solid fill
   *
   * border-radius on cards: works everywhere except Outlook (ignored, degrades
   *   gracefully to square corners — acceptable).
   *
   * rgba() colours: not supported in Outlook. Replace with solid equivalents
   *   for any foreground text/borders inside the purple band.
   */

  /* ── HTML ───────────────────────────────────────────── */
  const html = `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <title>${safeBrand} - Policy ${safePolicy}</title>
  <style>
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; }
    /* Link colours */
    a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; }
    .purple-link a { color:#6c4cf3 !important; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0edff;-webkit-font-smoothing:antialiased;">

  <!-- Preview text -->
  <div style="display:none;font-size:1px;color:#f0edff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">Your Coverza policy is confirmed &mdash; ${safePolicy}. Your documents are attached.&#847;&zwnj;&nbsp;</div>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f0edff" style="background-color:#f0edff;">
    <tr>
      <td align="center" style="padding:28px 14px 40px 14px;">

        <!-- Content width -->
        <table role="presentation" width="580" cellpadding="0" cellspacing="0" border="0" style="width:580px;max-width:100%;">

          <!-- ══════════════ HEADER ══════════════ -->
          <tr>
            <td style="padding:0 0 16px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;color:#6c4cf3;font-size:22px;font-weight:700;letter-spacing:-0.5px;line-height:1;">${safeBrand}</p>
                    <p style="margin:3px 0 0 0;font-family:Arial,Helvetica,sans-serif;color:#7c6baa;font-size:11px;line-height:1;">Coverage that connects</p>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td bgcolor="#ede8ff" style="background-color:#ede8ff;border-radius:999px;padding:7px 13px;">
                          <span style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:400;color:#5b45b8;">Policy </span><span style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#1a0f3a;">${safePolicy}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ══════════════ MAIN CARD ══════════════ -->
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:24px;overflow:hidden;" align="left">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- ── HERO BAND (purple — VML for Outlook) ── -->
                <tr>
                  <td bgcolor="#6c4cf3" style="background-color:#6c4cf3;padding:0;mso-padding-alt:0;">
                    <!--[if gte mso 9]>
                    <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:580px;">
                      <v:fill type="solid" color="#6c4cf3" />
                      <v:textbox style="mso-fit-shape-to-text:true" inset="30px,30px,30px,30px">
                    <![endif]-->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:30px 30px 26px 30px;">

                          <!-- Confirmed pill -->
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
                            <tr>
                              <td bgcolor="#7d60f5" style="background-color:#7d60f5;border-radius:999px;padding:6px 12px;">
                                <span style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">&#10003;&nbsp; Cover confirmed</span>
                              </td>
                            </tr>
                          </table>

                          <!-- Headline -->
                          <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:30px;font-weight:700;letter-spacing:-0.8px;line-height:1.08;">You&rsquo;re covered.</p>

                          <!-- Sub -->
                          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;color:#cfc5fb;font-size:14px;line-height:1.6;">Your temporary insurance policy is in force. Documents are attached and available through the links below.</p>

                          <!-- Summary chips -->
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;border-collapse:separate;border-spacing:0;">
                            <tr>

                              <!-- Policy chip -->
                              <td style="padding-right:8px;vertical-align:top;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td bgcolor="#7d60f5" style="background-color:#7d60f5;border-radius:10px;padding:10px 13px;">
                                      <p style="margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:700;color:#cfc5fb;text-transform:uppercase;letter-spacing:0.8px;">Policy</p>
                                      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#ffffff;">${safePolicy}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>

                              ${safeVeh ? `
                              <!-- Vehicle chip -->
                              <td style="padding-right:8px;vertical-align:top;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td bgcolor="#7d60f5" style="background-color:#7d60f5;border-radius:10px;padding:10px 13px;">
                                      <p style="margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:700;color:#cfc5fb;text-transform:uppercase;letter-spacing:0.8px;">Vehicle</p>
                                      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#ffffff;">${safeVeh}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              ` : ""}

                              ${safeStart && safeEnd ? `
                              <!-- Cover period chip -->
                              <td style="vertical-align:top;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td bgcolor="#7d60f5" style="background-color:#7d60f5;border-radius:10px;padding:10px 13px;">
                                      <p style="margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:700;color:#cfc5fb;text-transform:uppercase;letter-spacing:0.8px;">Cover period</p>
                                      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#ffffff;line-height:1.5;">${safeStart}</p>
                                      <p style="margin:2px 0;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:400;color:#cfc5fb;">to</p>
                                      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#ffffff;line-height:1.5;">${safeEnd}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              ` : ""}

                            </tr>
                          </table>

                        </td>
                      </tr>
                    </table>
                    <!--[if gte mso 9]>
                      </v:textbox>
                    </v:rect>
                    <![endif]-->
                  </td>
                </tr>

                <!-- ── DOCUMENTS ── -->
                <tr>
                  <td bgcolor="#ffffff" style="background-color:#ffffff;padding:24px 30px 10px 30px;">
                    <p style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;color:#1a0f3a;font-size:14px;font-weight:700;">Your documents</p>

                    <!-- Primary button — certificate -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td bgcolor="#6c4cf3" style="background-color:#6c4cf3;border-radius:12px;text-align:center;">
                          <a href="${safeCertUrl}" style="display:block;padding:14px 20px;font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;text-align:center;">
                            Download certificate of insurance
                          </a>
                        </td>
                      </tr>
                    </table>

                    <div style="height:8px;line-height:8px;font-size:8px;">&nbsp;</div>

                    <!-- Secondary button — statement -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td bgcolor="#faf9ff" style="background-color:#faf9ff;border-radius:12px;border:1px solid #ddd5fc;text-align:center;">
                          <a href="${safePropUrl}" style="display:block;padding:13px 20px;font-family:Arial,Helvetica,sans-serif;color:#4a3a9e;font-size:14px;font-weight:700;text-decoration:none;text-align:center;">
                            View statement of fact &amp; declaration
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:10px 0 0 0;font-family:Arial,Helvetica,sans-serif;color:#9ca3af;font-size:12px;line-height:1.6;">Both documents are also attached to this email as PDFs.</p>
                  </td>
                </tr>

                <!-- ── WHAT HAPPENS NEXT ── -->
                <tr>
                  <td bgcolor="#ffffff" style="background-color:#ffffff;padding:14px 30px 0 30px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td bgcolor="#faf9ff" style="background-color:#faf9ff;border-radius:16px;border:1px solid #ede8ff;padding:16px 18px;">
                          <p style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;color:#1a0f3a;font-size:13px;font-weight:700;">What happens next</p>

                          <!-- Step 1 -->
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
                            <tr>
                              <td style="vertical-align:top;padding-right:10px;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td bgcolor="#6c4cf3" style="background-color:#6c4cf3;border-radius:999px;width:20px;height:20px;text-align:center;">
                                      <span style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#ffffff;line-height:20px;">1</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="vertical-align:middle;">
                                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;color:#374151;font-size:12.5px;line-height:1.5;">Review your certificate and statement carefully &mdash; check all details are correct.</p>
                              </td>
                            </tr>
                          </table>

                          <!-- Step 2 -->
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
                            <tr>
                              <td style="vertical-align:top;padding-right:10px;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td bgcolor="#6c4cf3" style="background-color:#6c4cf3;border-radius:999px;width:20px;height:20px;text-align:center;">
                                      <span style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#ffffff;line-height:20px;">2</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="vertical-align:middle;">
                                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;color:#374151;font-size:12.5px;line-height:1.5;">Save both PDFs to your device and keep the certificate accessible while driving.</p>
                              </td>
                            </tr>
                          </table>

                          <!-- Step 3 -->
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="vertical-align:top;padding-right:10px;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td bgcolor="#6c4cf3" style="background-color:#6c4cf3;border-radius:999px;width:20px;height:20px;text-align:center;">
                                      <span style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#ffffff;line-height:20px;">3</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="vertical-align:middle;">
                                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;color:#374151;font-size:12.5px;line-height:1.5;">If any detail is wrong, contact us <span style="color:#6c4cf3;font-weight:700;">before</span> driving.</p>
                              </td>
                            </tr>
                          </table>

                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ── MID NOTICE ── -->
                <tr>
                  <td bgcolor="#ffffff" style="background-color:#ffffff;padding:12px 30px 0 30px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td bgcolor="#f9fafb" style="background-color:#f9fafb;border-radius:12px;border:1px solid #e9eaeb;padding:12px 15px;">
                          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6b7280;">
                            <span style="color:#374151;font-weight:700;">MID records</span> update several times daily. Please allow a few hours for your cover to appear. Your certificate is legal proof of insurance if asked.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ── HELP LINE ── -->
                <tr>
                  <td bgcolor="#ffffff" style="background-color:#ffffff;padding:16px 30px 26px 30px;text-align:center;">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:13px;line-height:1.7;">
                      Questions or concerns? Reply to this email or contact <a href="mailto:${safeSupport}" style="color:#6c4cf3;font-weight:700;text-decoration:none;">${safeSupport}</a>.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- ══════════════ FOOTER ══════════════ -->
          <tr>
            <td style="padding:18px 4px 0 4px;">

              <p style="margin:0 0 12px 0;text-align:center;font-family:Arial,Helvetica,sans-serif;color:#9ca3af;font-size:11px;line-height:1.6;">
                ${safeBrand} &middot; Policy ${safePolicy} &middot; <a href="mailto:${safeSupport}" style="color:#7c6baa;text-decoration:none;">${safeSupport}</a>
              </p>

              <!-- Regulatory -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
                <tr>
                  <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:14px;border:1px solid #e9eaeb;padding:14px 18px;">
                    <p style="margin:0 0 5px 0;font-family:Arial,Helvetica,sans-serif;color:#374151;font-size:11px;font-weight:700;">Regulatory &amp; legal information</p>
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:10px;line-height:1.65;">
                      We hereby certify that the policy satisfies the requirements of the relevant law applicable in Great Britain, Northern Ireland, the Isle of Man, and the islands of Alderney, Guernsey and Jersey.<br /><br />
                      Coverza Limited is authorised by the Gibraltar Financial Services Commission to carry on insurance business under the Financial Services Act 2019 and Financial Services Regulations 2020, registered address 5/5 Crutchett&apos;s Ramp, Gibraltar. Details about our regulation by the Financial Conduct Authority and Prudential Regulation Authority are available on request.<br /><br />
                      Registered in England and Wales as <strong style="color:#4b5563;">ACCELERANT INSURANCE UK LIMITED</strong>. Reg. No. 03326800. Registered Address: One, Fleet Place, London, England, EC4M 7WS. Authorised and regulated by the Financial Conduct Authority (207658).
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Confidentiality -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:14px;border:1px solid #e9eaeb;padding:14px 18px;">
                    <p style="margin:0 0 5px 0;font-family:Arial,Helvetica,sans-serif;color:#374151;font-size:11px;font-weight:700;">Confidentiality notice</p>
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:10px;line-height:1.65;">
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
</html>`.trim();

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