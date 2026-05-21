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
  if (!url || !isHttpUrl(url)) {
    throw new Error(`${label} must be a valid http(s) URL`);
  }

  if (!/\.pdf(\?|#|$)/i.test(url)) {
    throw new Error(`${label} must point to a .pdf`);
  }

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
  const vrm = (input.vrm || "").trim();
  const mm = [input.make, input.model].filter(Boolean).join(" ").trim();
  const year = (input.year || "").trim();

  const parts = [vrm || null, mm || null, year ? `(${year})` : null].filter(
    Boolean
  );

  return parts.length ? parts.join(" ") : null;
}

export async function sendPolicyEmail(input: SendPolicyEmailInput) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("RESEND_FROM");
  const replyTo = (process.env.RESEND_REPLY_TO || "").trim();

  if (!input?.policyNumber?.trim()) {
    throw new Error("policyNumber is required");
  }

  if (!input?.to?.trim() || !validEmail(input.to)) {
    throw new Error("to must be a valid email");
  }

  const certificateUrl = cleanPdfUrl(input.certificateUrl, "certificateUrl");
  const proposalUrl = cleanPdfUrl(input.proposalUrl, "proposalUrl");

  const brandName = "Coverza";
  const supportEmail = replyTo || "support@coverza.co.uk";
  const policyNumber = input.policyNumber.trim();

  const veh = vehicleLine(input);
  const start = fmtDateTime(input.startAtISO);
  const end = fmtDateTime(input.endAtISO);

  const subject = `Cover confirmed — Policy ${policyNumber}`;

  const textLines: string[] = [
    `${brandName} — Cover confirmed`,
    "",
    `Policy number: ${policyNumber}`,
  ];

  if (veh) textLines.push(`Insured vehicle: ${veh}`);
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
    "1) Review your Certificate and Statement of Fact carefully to ensure all details are correct.",
    "2) Save the PDFs to your device and keep the Certificate accessible while the vehicle is in use.",
    "3) If any detail is incorrect, contact us immediately so we can advise on the right next step.",
    "",
    "Motor Insurance Database (MID / askMID / Navigate):",
    "MID records are updated several times daily. Please allow a few hours for your cover to appear after purchase.",
    "If you are asked to provide proof of insurance, your Certificate of Motor Insurance is legal evidence of cover.",
    "",
    `Questions or concerns? Reply to this email or contact ${supportEmail}.`,
    "",
    "Regulatory & legal information:",
    "We hereby certify that the policy satisfies the requirements of the relevant law applicable in Great Britain, Northern Ireland, the Isle of Man, and the islands of Alderney, Guernsey and Jersey.",
    "",
    "Coverza Limited is authorised by the Gibraltar Financial Services Commission to carry on insurance business under the Financial Services Act 2019 and Financial Services Regulations 2020, registered address 5/5 Crutchett’s Ramp, Gibraltar.",
    "Details about our regulation by the Financial Conduct Authority and Prudential Regulation Authority are available on request.",
    "",
    "Registered in England and Wales as ACCELERANT INSURANCE UK LIMITED. Reg. No. 03326800. Registered Address: One, Fleet Place, London, England, EC4M 7WS. Authorised and regulated by the Financial Conduct Authority (207658).",
    "",
    "Confidentiality notice:",
    "The content of this email is confidential and intended only for the recipient specified. It is strictly forbidden to share any part of this message with any third party without the written consent of the sender.",
    "If you received this message by mistake, please reply to this email and then delete it so we can help prevent this happening again.",
    "",
    `— ${brandName}`
  );

  const text = textLines.join("\n");

  const safePolicy = escapeHtml(policyNumber);
  const safeVeh = veh ? escapeHtml(veh) : null;
  const safeStart = start ? escapeHtml(start) : null;
  const safeEnd = end ? escapeHtml(end) : null;
  const safeSupport = escapeHtml(supportEmail);
  const safeCertUrl = escapeHtml(certificateUrl);
  const safePropUrl = escapeHtml(proposalUrl);
  const safeTo = escapeHtml(input.to);
  const safeBrand = escapeHtml(brandName);

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

  <body style="margin:0;padding:0;background:#f6f7fb;">
    <div style="display:none;font-size:1px;color:#f6f7fb;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      Your Coverza temporary insurance policy is confirmed. Policy ${safePolicy}.
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f7fb;">
      <tr>
        <td align="center" style="padding:32px 14px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="620" style="width:620px;max-width:100%;">

            <!-- Brand header -->
            <tr>
              <td style="padding:0 2px 18px 2px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="left" style="vertical-align:middle;">
                      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#6c4cf3;font-size:20px;line-height:1.1;font-weight:900;letter-spacing:-0.4px;">
                        ${safeBrand}
                      </div>
                      <div style="margin-top:4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#64748b;font-size:12px;line-height:1.4;">
                        Coverage that connects
                      </div>
                    </td>

                    <td align="right" style="vertical-align:middle;">
                      <div style="display:inline-block;border:1px solid #e2e8f0;background:#ffffff;border-radius:999px;padding:7px 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#475569;font-size:12px;line-height:1;font-weight:700;">
                        Policy ${safePolicy}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Main card -->
            <tr>
              <td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:28px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.08);">

                <!-- Hero -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding:30px 28px 22px 28px;">
                      <div style="display:inline-block;background:#f3efff;color:#6c4cf3;border:1px solid #ddd3ff;border-radius:999px;padding:7px 11px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1;font-weight:800;">
                        Cover confirmed
                      </div>

                      <div style="height:18px;line-height:18px;font-size:18px;">&nbsp;</div>

                      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;font-size:34px;line-height:1.08;font-weight:850;letter-spacing:-1.1px;">
                        Your temporary car insurance is active.
                      </div>

                      <div style="height:12px;line-height:12px;font-size:12px;">&nbsp;</div>

                      <div style="max-width:500px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#475569;font-size:15px;line-height:1.65;">
                        Your policy documents are attached to this email. You can also open them instantly using the secure links below.
                      </div>
                    </td>
                  </tr>

                  <!-- Soft divider -->
                  <tr>
                    <td style="padding:0 28px;">
                      <div style="height:1px;line-height:1px;background:#edf0f5;">&nbsp;</div>
                    </td>
                  </tr>

                  <!-- Policy snapshot -->
                  <tr>
                    <td style="padding:22px 28px 6px 28px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td style="padding:0 0 14px 0;">
                            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;font-size:14px;line-height:1.3;font-weight:850;">
                              Policy summary
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td>
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb;border-radius:20px;background:#fbfcff;">
                              <tr>
                                <td style="padding:16px;">
                                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                      <td style="width:50%;padding:0 10px 14px 0;vertical-align:top;">
                                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#94a3b8;font-size:11px;line-height:1.3;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;">
                                          Policy number
                                        </div>
                                        <div style="margin-top:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;font-size:15px;line-height:1.35;font-weight:850;">
                                          ${safePolicy}
                                        </div>
                                      </td>

                                      <td style="width:50%;padding:0 0 14px 10px;vertical-align:top;">
                                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#94a3b8;font-size:11px;line-height:1.3;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;">
                                          Email
                                        </div>
                                        <div style="margin-top:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;font-size:13px;line-height:1.35;font-weight:750;word-break:break-all;">
                                          ${safeTo}
                                        </div>
                                      </td>
                                    </tr>

                                    ${
                                      safeVeh
                                        ? `
                                    <tr>
                                      <td colspan="2" style="padding:0 0 14px 0;vertical-align:top;">
                                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#94a3b8;font-size:11px;line-height:1.3;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;">
                                          Vehicle
                                        </div>
                                        <div style="margin-top:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;font-size:15px;line-height:1.35;font-weight:850;">
                                          ${safeVeh}
                                        </div>
                                      </td>
                                    </tr>
                                        `
                                        : ""
                                    }

                                    ${
                                      safeStart && safeEnd
                                        ? `
                                    <tr>
                                      <td style="width:50%;padding:0 10px 0 0;vertical-align:top;">
                                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#94a3b8;font-size:11px;line-height:1.3;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;">
                                          Starts
                                        </div>
                                        <div style="margin-top:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;font-size:13px;line-height:1.45;font-weight:800;">
                                          ${safeStart}
                                        </div>
                                      </td>

                                      <td style="width:50%;padding:0 0 0 10px;vertical-align:top;">
                                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#94a3b8;font-size:11px;line-height:1.3;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;">
                                          Ends
                                        </div>
                                        <div style="margin-top:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;font-size:13px;line-height:1.45;font-weight:800;">
                                          ${safeEnd}
                                        </div>
                                      </td>
                                    </tr>
                                        `
                                        : ""
                                    }
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Document actions -->
                  <tr>
                    <td style="padding:18px 28px 4px 28px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td style="padding:0 0 12px 0;">
                            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;font-size:14px;line-height:1.3;font-weight:850;">
                              Your documents
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td>
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td style="padding:0 0 10px 0;">
                                  <a href="${safeCertUrl}" style="display:block;text-decoration:none;background:#6c4cf3;border:1px solid #6c4cf3;border-radius:17px;padding:15px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;font-size:14px;line-height:1.2;font-weight:850;text-align:center;box-shadow:0 12px 26px rgba(108,76,243,0.22);">
                                    Download certificate
                                  </a>
                                </td>
                              </tr>

                              <tr>
                                <td>
                                  <a href="${safePropUrl}" style="display:block;text-decoration:none;background:#ffffff;border:1px solid #e2e8f0;border-radius:17px;padding:15px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;font-size:14px;line-height:1.2;font-weight:850;text-align:center;">
                                    View statement of fact
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <tr>
                          <td style="padding:12px 0 0 0;">
                            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#64748b;font-size:12.5px;line-height:1.6;">
                              Both PDFs are also attached to this email for your records.
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Guidance -->
                  <tr>
                    <td style="padding:20px 28px 28px 28px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:20px;">
                        <tr>
                          <td style="padding:17px 18px;">
                            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;font-size:14px;line-height:1.3;font-weight:850;">
                              Before you drive
                            </div>

                            <div style="height:8px;line-height:8px;font-size:8px;">&nbsp;</div>

                            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#475569;font-size:13px;line-height:1.7;">
                              Review your certificate and statement carefully. Save the PDFs to your device and keep the certificate accessible while the vehicle is in use.
                            </div>

                            <div style="height:12px;line-height:12px;font-size:12px;">&nbsp;</div>

                            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#475569;font-size:13px;line-height:1.7;">
                              MID records update several times daily, so please allow a few hours for the cover to appear after purchase. Your certificate is legal evidence of cover.
                            </div>
                          </td>
                        </tr>
                      </table>

                      <div style="height:16px;line-height:16px;font-size:16px;">&nbsp;</div>

                      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#64748b;font-size:13px;line-height:1.7;text-align:center;">
                        Need help? Reply to this email or contact
                        <span style="font-weight:850;color:#0f172a;">${safeSupport}</span>.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:18px 6px 0 6px;">
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#94a3b8;font-size:11px;line-height:1.65;text-align:center;">
                  ${safeBrand} temporary insurance.
                  <br />
                  Policy ${safePolicy}. Documents attached and available through the links above.
                </div>

                <div style="height:14px;line-height:14px;font-size:14px;">&nbsp;</div>

                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#94a3b8;font-size:10.5px;line-height:1.65;text-align:left;">
                  We hereby certify that the policy satisfies the requirements of the relevant law applicable in Great Britain, Northern Ireland, the Isle of Man, and the islands of Alderney, Guernsey and Jersey.
                  <br /><br />
                  Coverza Limited is authorised by the Gibraltar Financial Services Commission to carry on insurance business under the Financial Services Act 2019 and Financial Services Regulations 2020, registered address 5/5 Crutchett’s Ramp, Gibraltar.
                  <br /><br />
                  Registered in England and Wales as ACCELERANT INSURANCE UK LIMITED. Reg. No. 03326800. Registered Address: One, Fleet Place, London, England, EC4M 7WS. Authorised and regulated by the Financial Conduct Authority (207658).
                </div>
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