// lib/policy/certificate.tsx
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

export type CertificatePdfInput = {
  certificateNumber: string;

  policyNumber?: string;
  vrm: string;
  make?: string | null;
  model?: string | null;
  year?: string | null;

  policyholderName: string;

  startAtISO: string;
  endAtISO: string;

  // Required for loading /public assets in @react-pdf server context
  baseUrl: string;

  signatureUrl?: string | null; // optional override
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatLongUKDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const day = d.getDate();
  const month = d.toLocaleString("en-GB", { month: "long" });
  const year = d.getFullYear();
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${hh}:${mm} hours - ${day} ${month} ${year}`;
}

function vehicleDesc(make?: string | null, model?: string | null, year?: string | null) {
  return [make, model, year].filter(Boolean).join(" ").trim() || "—";
}

/** Main “certificate row” with left label and right value (GoShorty-ish). */
function CertRow({
  n,
  left,
  right,
}: {
  n: string;
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowN}>{n}</Text>
      <View style={styles.rowLeft}>{left}</View>

      {/* IMPORTANT: do NOT wrap `right` in a Text — it must be able to be a View */}
      <View style={styles.rowRight}>{right}</View>
    </View>
  );
}

function Watermark() {
  // More marks + tighter tiling so it fills the whole box consistently
  const marks = Array.from({ length: 320 });
  return (
    <View style={styles.wmLayer} fixed>
      {marks.map((_, i) => (
        <Text key={i} style={styles.wmText}>
          ACCELERANT
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 18,
    fontSize: 10,
    color: "#111827",
  },

  // Outer border (whole page)
  outerBorder: {
    borderWidth: 1,
    borderColor: "#111827",
    padding: 12,
    height: "100%",
  },

  // Header
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  logo: {
    width: 155, // slightly smaller = more room for centre title
    height: 38,
    objectFit: "contain",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingTop: 2,
    paddingHorizontal: 8,
  },

  // Force company name to stay on a single line by:
  // - giving centre more room (logo/right shrunk)
  // - slightly reducing font
  // - wrap={false} on the Text usage
  headerCompany: {
    fontSize: 11.2,
    fontWeight: 800,
    letterSpacing: 0.15,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: 800,
    marginTop: 2,
    letterSpacing: 0.2,
  },

  headerRight: {
    width: 145, // narrower so centre gets more room
    alignItems: "flex-end",
    paddingTop: 2,
  },
  certNoLabel: {
    fontSize: 9,
    color: "#111827",
  },
  certNoValue: {
    fontSize: 10,
    fontWeight: 800,
    marginTop: 2,
  },
  headerRule: {
    height: 1,
    backgroundColor: "#111827",
    marginTop: 6,
  },

  // Main body “box” (watermark should be confined here)
  bodyBox: {
    position: "relative",
    borderWidth: 1,
    borderColor: "#111827",
    padding: 10,
    marginTop: 10,
    minHeight: 470,
    overflow: "hidden",
  },

  // Watermark layer (confined by overflow hidden on bodyBox)
  wmLayer: {
    position: "absolute",
    top: -90,
    left: -90,
    right: -90,
    bottom: -90,
    transform: "rotate(-30deg)",
    opacity: 0.07,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  wmText: {
    fontSize: 10, // smaller
    fontWeight: 700,
    color: "#111827",
    marginRight: 8, // tighter horizontal tiling
    marginBottom: 6, // tighter vertical tiling
    letterSpacing: 1.1,
  },

  // Rows
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  rowN: {
    width: 18,
    fontWeight: 800,
  },
  rowLeft: {
    flex: 1,
    paddingRight: 10,
  },
  rowRight: {
    width: 210,
  },

  label: {
    fontSize: 9.5,
    color: "#111827",
  },
  value: {
    fontSize: 10,
    color: "#111827",
  },
  valueStrong: {
    fontSize: 10,
    color: "#111827",
    fontWeight: 800,
  },

  // Sub bullets a) b)
  subLine: {
    flexDirection: "row",
    marginBottom: 3,
  },
  subKey: { width: 14, fontSize: 9.5, fontWeight: 800 },
  subText: { flex: 1, fontSize: 9.5 },

  // Right-side line blocks that align with a/b lines
  rightLine: {
    marginBottom: 3,
  },

  // Footer block (inside outer border)
  footerWrap: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#111827",
    paddingTop: 8,
  },
  certify: {
    fontSize: 9,
    lineHeight: 1.25,
    marginBottom: 8,
  },
  underwriter: {
    fontSize: 9,
    fontStyle: "italic",
    marginBottom: 10,
  },

  sigRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  sigLeft: { width: "50%" },

  sigImg: { width: 300, height: 80, objectFit: "contain" },

  sigName: { fontSize: 10, fontWeight: 800 },
  sigRole: { fontSize: 9, marginTop: 2 },

  noteBox: {
    borderWidth: 1,
    borderColor: "#111827",
    padding: 8,
  },
  noteTitle: { fontSize: 9, fontWeight: 800, marginBottom: 4 },
  noteLine: { fontSize: 8.5, lineHeight: 1.25 },

  bottomLegal: {
    marginTop: 8,
    fontSize: 7.6,
    color: "#111827",
    lineHeight: 1.25,
    textAlign: "center",
  },
});

function CertificateDoc(input: CertificatePdfInput) {
  const desc = vehicleDesc(input.make, input.model, input.year);

  // Default to your uploaded signature in /public/brand/signature.png
  const sigSrc = input.signatureUrl
    ? input.signatureUrl.startsWith("http")
      ? input.signatureUrl
      : `${input.baseUrl}${input.signatureUrl}`
    : `${input.baseUrl}/brand/signature.png`;

  return (
    <Document title={`Certificate - ${input.certificateNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.outerBorder}>
          {/* HEADER */}
          <View style={styles.headerTop}>
            <Image style={styles.logo} src={`${input.baseUrl}/brand/accelerant-v2.png`} />

            <View style={styles.headerCenter}>
              {/* wrap={false} prevents the unwanted “LIM- / ITED” break */}
              <Text style={styles.headerCompany} wrap={false}>
                ACCELERANT INSURANCE UK LIMITED
              </Text>
              <Text style={styles.headerTitle}>CERTIFICATE OF MOTOR INSURANCE</Text>
            </View>

            <View style={styles.headerRight}>
              <Text style={styles.certNoLabel}>Certificate Number:</Text>
              <Text style={styles.certNoValue}>{input.certificateNumber}</Text>
            </View>
          </View>

          <View style={styles.headerRule} />

          {/* BODY BOX (watermark confined here) */}
          <View style={styles.bodyBox}>
            <Watermark />

            {/* 1 */}
            <CertRow
              n="1"
              left={
                <>
                  <View style={styles.subLine}>
                    <Text style={styles.subKey}>a)</Text>
                    <Text style={styles.subText}>Registration Mark of Vehicle</Text>
                  </View>
                  <View style={styles.subLine}>
                    <Text style={styles.subKey}>b)</Text>
                    <Text style={styles.subText}>
                      Any vehicle supplied to the Policyholder under an agreement between Accelerant Insurance UK Limited and a repairer,
                      whilst the vehicle shown in (a) above is being repaired
                    </Text>
                  </View>
                </>
              }
              right={
                <View>
                  {/* 1a value */}
                  <View style={styles.rightLine}>
                    <Text style={styles.valueStrong}>{input.vrm}</Text>
                  </View>

                  {/* 1b value */}
                  <View style={styles.rightLine}>
                    <Text style={styles.value}>Not applicable unless otherwise stated.</Text>
                  </View>
                </View>
              }
            />

            {/* 2 */}
            <CertRow
              n="2"
              left={
                <View style={styles.subLine}>
                  <Text style={styles.subKey}>a)</Text>
                  <Text style={styles.subText}>Description of Vehicle</Text>
                </View>
              }
              right={
                <View>
                  <Text style={styles.valueStrong}>{desc}</Text>
                </View>
              }
            />

            {/* 3 */}
            <CertRow
              n="3"
              left={
                <View style={styles.subLine}>
                  <Text style={styles.subKey}>a)</Text>
                  <Text style={styles.subText}>Name of Policyholder</Text>
                </View>
              }
              right={
                <View>
                  <Text style={styles.valueStrong}>{input.policyholderName}</Text>
                </View>
              }
            />

            {/* 4 */}
            <CertRow
              n="4"
              left={
                <Text style={styles.label}>
                  Effective time and date of the commencement of insurance for the purposes of the relevant law:
                </Text>
              }
              right={
                <View>
                  <Text style={styles.valueStrong}>{formatLongUKDateTime(input.startAtISO)}</Text>
                </View>
              }
            />

            {/* 5 */}
            <CertRow
              n="5"
              left={<Text style={styles.label}>Date of expiry of insurance:</Text>}
              right={
                <View>
                  <Text style={styles.valueStrong}>{formatLongUKDateTime(input.endAtISO)}</Text>
                </View>
              }
            />

            {/* 6 */}
            <CertRow
              n="6"
              left={
                <Text style={styles.label}>
                  Persons or classes of persons entitled to drive (provided that the person driving holds a licence to drive the vehicle or has held and is not prevented from holding such a licence):
                </Text>
              }
              right={
                <View>
                  <Text style={styles.valueStrong}>The Policyholder</Text>
                </View>
              }
            />

            {/* 7 */}
            <CertRow
              n="7"
              left={<Text style={styles.label}>Limitations as to use subject to the exclusions below:</Text>}
              right={
                <View>
                  <Text style={styles.valueStrong}>
                    Use for social domestic and pleasure purposes and by the Policyholder in person in connection with his/her business or profession.
                  </Text>
                </View>
              }
            />

            {/* Exclusions */}
            <View style={{ marginTop: 6 }}>
              <Text style={[styles.label, { fontWeight: 800, marginBottom: 4 }]}>Exclusions</Text>
              <Text style={[styles.value, { fontSize: 9.3, lineHeight: 1.25 }]}>
                • Use for hiring commercial travelling or use for any purpose in connection with the Motor Trade.{"\n"}
                • The insurance does not cover use for racing, pacemaking, competition, rallies, trials or speedtesting.{"\n"}
                • Use to secure the release of a motor vehicle, other than the vehicle identified above by its registration mark, which has been seized by, or on behalf of any Government or public authority.
              </Text>
            </View>
          </View>

          {/* FOOTER */}
          <View style={styles.footerWrap}>
            <Text style={styles.certify}>
              I hereby certify that the Insurance Policy to which this Certificate relates satisfies the requirements of the relevant Law
              applicable in Great Britain, Northern Ireland, the Isle of Man, and the islands of Alderney, Guernsey and Jersey.
            </Text>

            <Text style={styles.underwriter}>
              Underwritten by Accelerant Insurance UK Limited - Authorised Insurers
            </Text>

            <View style={styles.sigRow}>
              <View style={styles.sigLeft}>
                <Image style={styles.sigImg} src={sigSrc} />
                <Text style={styles.sigName}>Emma Huntington</Text>
                <Text style={styles.sigRole}>for the Authorised Insurers</Text>
              </View>

              <View style={{ width: "48%" }}>
                <View style={styles.noteBox}>
                  <Text style={styles.noteTitle}>NOTE:</Text>
                  <Text style={styles.noteLine}>
                    For full details of the insurance cover reference should be made to the policy.
                  </Text>
                  <Text style={[styles.noteLine, { marginTop: 5 }]}>
                    <Text style={{ fontWeight: 800 }}>ADVICE TO THIRD PARTIES:</Text>{" "}
                    Nothing contained in this Certificate affects your right as a third party to make a claim.
                  </Text>
                  <Text style={[styles.noteLine, { marginTop: 5 }]}>
                    <Text style={{ fontWeight: 800 }}>WARNING:</Text>{" "}
                    This certificate has been prepared using a laser printer and is not valid if altered in any way.
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.bottomLegal}>
              We hereby certify that the policy satisfies the requirements of the relevant law applicable in Great Britain, Northern Ireland,
              the Isle of Man, and the islands of Alderney, Guernsey and Jersey. Coverza Limited is authorised by the Gibraltar Financial
              Services Commission to carry on insurance business under the Financial Services Act 2019 and Financial Services Regulations 2020,
              registered address 5/5 Crutchett’s Ramp, Gibraltar. Details about our regulation by the Financial Conduct Authority and Prudential
              Regulation Authority are available on request. Registered in England and Wales as ACCELERANT INSURANCE UK LIMITED. Reg. No. 03326800.
              Registered Address: One, Fleet Place, London, England, EC4M 7WS. Authorised and regulated by the Financial Conduct Authority (207658).
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function renderCertificatePdf(input: CertificatePdfInput): Promise<Buffer> {
  return await renderToBuffer(<CertificateDoc {...input} />);
}
