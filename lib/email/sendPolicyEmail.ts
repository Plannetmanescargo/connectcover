// lib/email/sendPolicyEmail.ts
import { Buffer } from "node:buffer";
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

async function pdfUrlToBase64(url: string, label: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/pdf",
    },
  });

  if (!response.ok) {
    throw new Error(`${label} could not be downloaded: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!buffer.length) {
    throw new Error(`${label} downloaded as an empty file`);
  }

  const header = buffer.subarray(0, 4).toString("utf8");
  if (header !== "%PDF") {
    const contentType = response.headers.get("content-type") || "unknown";
    throw new Error(`${label} did not download as a valid PDF. Content-Type: ${contentType}`);
  }

  return buffer.toString("base64");
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
  const parts = [vrm || null, mm || null, year ? `(${year})` : null].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

export async function sendPolicyEmail(input: SendPolicyEmailInput) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("RESEND_FROM");
  const replyTo = (process.env.RESEND_REPLY_TO || "").trim();

  if (!input?.policyNumber?.trim()) throw new Error("policyNumber is required");
  if (!input?.to?.trim() || !validEmail(input.to)) throw new Error("to must be a valid email");

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
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>${safeBrand} — Policy ${safePolicy}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;">
    <div style="display:none;font-size:1px;color:#f6f7fb;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      Cover confirmed. Policy ${safePolicy}. Documents attached and available via secure links.
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f7fb;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="width:640px;max-width:100%;">

            <tr>
              <td style="padding:0 4px 14px 4px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="left">
                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#6c4cf3;font-weight:900;font-size:17px;letter-spacing:-0.2px;">
                        ${safeBrand}
                      </div>
                      <div style="margin-top:3px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#64748b;font-size:12px;">
                        Temporary insurance, made clearer
                      </div>
                    </td>
                    <td align="right" style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#64748b;font-size:12px;vertical-align:top;">
                      Policy <span style="font-weight:900;color:#0f172a;">${safePolicy}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;box-shadow:0 10px 28px rgba(15,23,42,0.08);">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding:18px 18px 0 18px;">
                      <span style="display:inline-block;background:#f3efff;color:#6c4cf3;border:1px solid #ddd3ff;padding:6px 10px;border-radius:999px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:12px;font-weight:900;">
                        Payment received
                      </span>

                      <div style="height:12px;line-height:12px;font-size:12px;">&nbsp;</div>

                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:26px;line-height:1.15;letter-spacing:-0.5px;color:#0f172a;font-weight:900;">
                        Your Coverza policy is confirmed
                      </div>

                      <div style="height:8px;line-height:8px;font-size:8px;">&nbsp;</div>

                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#475569;font-size:14px;line-height:1.7;">
                        Your temporary insurance is now in force. Your policy documents are attached to this email and also available through the buttons below.
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:16px 18px 0 18px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td align="left" style="padding-right:10px;">
                            <a href="${safeCertUrl}"
                               style="display:inline-block;text-decoration:none;background:#6c4cf3;color:#ffffff;border:1px solid #6c4cf3;border-radius:14px;padding:12px 14px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;font-weight:900;box-shadow:0 10px 24px rgba(108,76,243,0.18);">
                              Download certificate (PDF)
                            </a>
                          </td>
                          <td align="left">
                            <a href="${safePropUrl}"
                               style="display:inline-block;text-decoration:none;background:#ffffff;color:#0f172a;border:1px solid #e2e8f0;border-radius:14px;padding:12px 14px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;font-weight:900;">
                              View statement (PDF)
                            </a>
                          </td>
                        </tr>
                      </table>

                      <div style="height:14px;line-height:14px;font-size:14px;">&nbsp;</div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 18px 18px 18px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
                        <tr>
                          <td style="padding:14px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td style="width:50%;padding-right:8px;vertical-align:top;">
                                  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:11px;letter-spacing:0.10em;text-transform:uppercase;color:#64748b;font-weight:800;">
                                    Policy number
                                  </div>
                                  <div style="margin-top:6px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:16px;color:#0f172a;font-weight:950;">
                                    ${safePolicy}
                                  </div>
                                </td>

                                <td style="width:50%;padding-left:8px;vertical-align:top;">
                                  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:11px;letter-spacing:0.10em;text-transform:uppercase;color:#64748b;font-weight:800;">
                                    Policyholder email
                                  </div>
                                  <div style="margin-top:6px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:#0f172a;font-weight:800;word-break:break-all;">
                                    ${safeTo}
                                  </div>
                                </td>
                              </tr>

                              ${
                                safeVeh
                                  ? `
                              <tr>
                                <td colspan="2" style="padding-top:12px;">
                                  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:11px;letter-spacing:0.10em;text-transform:uppercase;color:#64748b;font-weight:800;">
                                    Insured vehicle
                                  </div>
                                  <div style="margin-top:6px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:#0f172a;font-weight:900;">
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
                                <td style="padding-top:12px;padding-right:8px;vertical-align:top;">
                                  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:11px;letter-spacing:0.10em;text-transform:uppercase;color:#64748b;font-weight:800;">
                                    Start of cover
                                  </div>
                                  <div style="margin-top:6px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:#0f172a;font-weight:900;">
                                    ${safeStart}
                                  </div>
                                </td>

                                <td style="padding-top:12px;padding-left:8px;vertical-align:top;">
                                  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:11px;letter-spacing:0.10em;text-transform:uppercase;color:#64748b;font-weight:800;">
                                    End of cover
                                  </div>
                                  <div style="margin-top:6px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:#0f172a;font-weight:900;">
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

                      <div style="height:14px;line-height:14px;font-size:14px;">&nbsp;</div>

                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:#0f172a;font-weight:950;margin-bottom:8px;">
                        Policy documents
                      </div>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e2e8f0;border-radius:16px;">
                        <tr>
                          <td style="padding:12px 12px 10px 12px;">
                            <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:#334155;line-height:1.7;">
                              • <span style="font-weight:900;color:#0f172a;">Certificate of Motor Insurance</span> (PDF)<br/>
                              • <span style="font-weight:900;color:#0f172a;">Statement of Fact &amp; Declaration</span> (PDF)
                            </div>
                          </td>
                        </tr>
                      </table>

                      <div style="height:14px;line-height:14px;font-size:14px;">&nbsp;</div>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:16px;">
                        <tr>
                          <td style="padding:12px;">
                            <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:12px;color:#0f172a;font-weight:950;margin-bottom:6px;">
                              Next steps
                            </div>
                            <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:12.5px;color:#334155;line-height:1.75;">
                              1) Review the <strong style="color:#0f172a;">Certificate</strong> and <strong style="color:#0f172a;">Statement of Fact</strong> carefully to ensure your details are correct.<br/>
                              2) Save the PDFs to your device and keep the Certificate accessible while the vehicle is in use.<br/>
                              3) If any detail is incorrect, contact us immediately so we can advise on the right next step.
                            </div>
                          </td>
                        </tr>
                      </table>

                      <div style="height:14px;line-height:14px;font-size:14px;">&nbsp;</div>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
                        <tr>
                          <td style="padding:12px;">
                            <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:12px;color:#0f172a;font-weight:950;margin-bottom:6px;">
                              Motor Insurance Database (MID / askMID / Navigate)
                            </div>
                            <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:12.5px;color:#334155;line-height:1.75;">
                              MID records are updated several times daily. Please allow a few hours for your cover to appear after purchase.<br/>
                              If you are asked to provide proof of insurance, your <strong style="color:#0f172a;">Certificate of Motor Insurance</strong> is legal evidence of cover.
                            </div>
                          </td>
                        </tr>
                      </table>

                      <div style="height:14px;line-height:14px;font-size:14px;">&nbsp;</div>

                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#475569;font-size:12.5px;line-height:1.75;">
                        Questions or concerns? Reply to this email or contact <span style="font-weight:900;color:#0f172a;">${safeSupport}</span>.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 6px 0 6px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#64748b;font-size:11px;line-height:1.65;">
                <div style="padding:12px 10px;border-top:1px solid #e2e8f0;">
                  <div style="font-weight:900;color:#0f172a;margin-bottom:6px;">Questions or concerns?</div>
                  <div>
                    Reply to this email or contact us at
                    <span style="font-weight:900;color:#0f172a;"> ${safeSupport}</span>.
                  </div>

                  <div style="height:12px;line-height:12px;font-size:12px;">&nbsp;</div>

                  <div style="font-weight:900;color:#0f172a;margin-bottom:6px;">Regulatory information</div>
                  <div>
                    We hereby certify that the policy satisfies the requirements of the relevant law applicable in Great Britain,
                    Northern Ireland, the Isle of Man, and the islands of Alderney, Guernsey and Jersey.
                  </div>
                  <div style="margin-top:8px;">
                    Coverza Limited is authorised by the Gibraltar Financial Services Commission to carry on insurance business under the
                    Financial Services Act 2019 and Financial Services Regulations 2020, registered address 5/5 Crutchett’s Ramp, Gibraltar.
                  </div>
                  <div style="margin-top:8px;">
                    Details about our regulation by the Financial Conduct Authority and Prudential Regulation Authority are available on request.
                  </div>
                  <div style="margin-top:8px;">
                    Registered in England and Wales as <span style="font-weight:900;color:#0f172a;">ACCELERANT INSURANCE UK LIMITED</span>.
                    Reg. No. 03326800. Registered Address: One, Fleet Place, London, England, EC4M 7WS.
                    Authorised and regulated by the Financial Conduct Authority (207658).
                  </div>

                  <div style="height:12px;line-height:12px;font-size:12px;">&nbsp;</div>

                  <div style="font-weight:900;color:#0f172a;margin-bottom:6px;">Confidentiality notice</div>
                  <div>
                    The content of this email is confidential and intended only for the recipient specified.
                    It is strictly forbidden to share any part of this message with any third party without the written consent of the sender.
                    If you received this message by mistake, please reply to this email and then delete it so we can help prevent this happening again.
                  </div>
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

let attachments:
  | {
      filename: string;
      content: string;
      contentType: string;
    }[]
  | undefined;

try {
  const [certificateContent, proposalContent] = await Promise.all([
    pdfUrlToBase64(certificateUrl, "Certificate PDF"),
    pdfUrlToBase64(proposalUrl, "Statement of Fact PDF"),
  ]);

  attachments = [
    {
      filename: `coverza-certificate-${policyNumber}.pdf`,
      content: certificateContent,
      contentType: "application/pdf",
    },
    {
      filename: `coverza-statement-of-fact-${policyNumber}.pdf`,
      content: proposalContent,
      contentType: "application/pdf",
    },
  ];
} catch (err) {
  console.error(
    "[sendPolicyEmail] PDF attachment download failed; sending email with document links only",
    err
  );
}

const res = await resend.emails.send({
  from,
  to: input.to,
  subject,
  ...(replyTo ? { replyTo } : {}),
  text,
  html,
  ...(attachments ? { attachments } : {}),
});

if (res.error) {
  console.error("[sendPolicyEmail] Resend error", res.error);
  throw new Error(res.error.message);
}

return res.data;
}