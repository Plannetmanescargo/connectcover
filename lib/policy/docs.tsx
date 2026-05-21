// lib/policy/docs.tsx
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

/**
 * Proposal / Statement of Fact & Declaration (GoShorty-style)
 * - Fixed header + fixed footer
 * - Header uses GoTempCover text (no Accelerant logo)
 * - Clean "document" typography (NO boxes around declarations)
 * - Page 1: two-column (facts left, declaration part 1 right)
 * - Continue declaration parts 2+3 FULL-WIDTH under columns (fills page 1, flows to page 2)
 */

export type ProposalPdfInput = {
  policyNumber: string;
  createdAtISO?: string;

  // quote
  vrm: string;
  make?: string | null;
  model?: string | null;
  year?: string | null;
  startAtISO: string;
  endAtISO: string;
  durationMs: number;

  // customer
  fullName: string;
  dobISO: string;
  email: string;
  address: string;
  licenceType: string;

  // branding/legal
  issuedBy?: string;
  baseUrl: string; // still used for loading public assets in server context
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
  return `${day} ${month} ${year} at ${hh}:${mm}`;
}

function formatLongUKDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const day = d.getDate();
  const month = d.toLocaleString("en-GB", { month: "long" });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function durationHuman(ms: number) {
  if (!ms || ms <= 0) return "—";

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  const mins = Math.ceil(ms / minute);
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;

  if (ms < hour) return mins === 1 ? "1 minute" : `${mins} minutes`;
  if (ms < day) return remMins ? `${hours} hours ${remMins} minutes` : `${hours} hours`;

  const days = Math.ceil(ms / day);
  return days === 1 ? "1 day" : `${days} days`;
}

// Layout constants
const HEADER_H = 64;
const FOOTER_H = 150;
const PAGE_PADDING_X = 34;

const BRAND = "#6c4cf3";
const BRAND_DARK = "#5b3fe0";
const BRAND_SOFT = "#f3efff";
const BRAND_BORDER = "#ddd3ff";
const INK = "#0f172a";
const TEXT = "#334155";
const MUTED = "#64748b";
const LINE = "#e7e5f4";

const styles = StyleSheet.create({
  page: {
    fontSize: 9.1,
    color: INK,
    lineHeight: 1.2,
    paddingTop: HEADER_H + 14,
    paddingBottom: FOOTER_H + 14,
    paddingHorizontal: PAGE_PADDING_X,
    backgroundColor: "#fcfbff",
  },

  /* Header (fixed) */
  headerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_H,
    backgroundColor: BRAND,
    paddingHorizontal: PAGE_PADDING_X,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  headerLeft: { flex: 1, alignItems: "flex-start", justifyContent: "center" },
  brandText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: 900,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.6,
  },

  headerRight: { width: 220, alignItems: "flex-end", justifyContent: "center" },
  headerRightText: { color: "#efeaff", fontSize: 8.8, letterSpacing: 0.9 },
  headerTitle: { color: "#ffffff", fontSize: 10.2, fontWeight: 800 },

  /* Footer (fixed) */
  footerWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: FOOTER_H,
    paddingHorizontal: PAGE_PADDING_X,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: BRAND_BORDER,
    backgroundColor: "#faf8ff",
  },
  footerGrid: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  footerCol: { flex: 1 },
  footerSmall: { fontSize: 7.4, color: TEXT, lineHeight: 1.18 },
  footerMuted: { fontSize: 7.4, color: MUTED, lineHeight: 1.18 },

  sigBlock: { marginTop: 5 },
  sigImg: { width: 110, height: 28, objectFit: "contain" },
  sigName: { fontSize: 7.4, color: INK, fontWeight: 800 },

  /* Titles */
  h1: {
    fontSize: 13.2,
    fontWeight: 900,
    letterSpacing: -0.2,
    marginBottom: 4,
    color: BRAND_DARK,
  },
  sub: { fontSize: 9.1, color: MUTED, marginBottom: 9 },

  /* Two-column layout */
  columns: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  colLeft: { flex: 0.98 },
  colRight: { flex: 1.02 },

  /* Sections */
  section: { marginBottom: 9 },
  sectionTitle: {
    fontSize: 10.0,
    fontWeight: 900,
    marginBottom: 5,
    color: BRAND_DARK,
  },
  para: { color: TEXT },

  /* Key-value table (compact) */
  kvWrap: {
    borderWidth: 1,
    borderColor: BRAND_BORDER,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  kvRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: BRAND_BORDER },
  kvRowFirst: { flexDirection: "row" },
  kvK: {
    width: "42%",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: BRAND_SOFT,
    color: BRAND_DARK,
    fontSize: 8.5,
    fontWeight: 700,
  },
  kvV: {
    width: "58%",
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 9.1,
    color: INK,
  },

  metaLine: { fontSize: 8.5, color: MUTED },
  metaStrong: { color: BRAND_DARK, fontWeight: 900 },

  /* Declarations */
  declTitle: {
    fontSize: 10.0,
    fontWeight: 900,
    marginBottom: 5,
    color: BRAND_DARK,
  },
  declIntro: {
    fontSize: 8.6,
    color: TEXT,
    marginBottom: 7,
    lineHeight: 1.22,
  },
  groupTitle: {
    fontSize: 9.2,
    fontWeight: 900,
    marginTop: 6,
    marginBottom: 4,
    color: BRAND_DARK,
  },

  itemRow: { flexDirection: "row", marginBottom: 3 },
  itemKey: { width: 16, fontSize: 8.4, fontWeight: 900, color: BRAND_DARK },
  itemText: { flex: 1, fontSize: 8.6, color: TEXT, lineHeight: 1.18 },

  divider: {
    marginTop: 8,
    marginBottom: 8,
    height: 1,
    backgroundColor: LINE,
  },

  belowColumns: { marginTop: 10 },
});

function Header() {
  return (
    <View style={styles.headerWrap} fixed>
      <View style={styles.headerLeft}>
        <Text style={styles.brandText}>Coverza</Text>
      </View>

      <View style={styles.headerRight}>
        <Text style={styles.headerRightText}>PROPOSAL</Text>
        <Text style={styles.headerTitle}>Statement of Fact &amp; Declaration</Text>
      </View>
    </View>
  );
}

function Footer({ baseUrl, signatureUrl }: { baseUrl: string; signatureUrl?: string | null }) {
  // Default to your uploaded signature in /public/brand/signature.png
  const sigSrc = signatureUrl
    ? signatureUrl.startsWith("http")
      ? signatureUrl
      : `${baseUrl}${signatureUrl}`
    : `${baseUrl}/brand/signature.png`;

  return (
    <View style={styles.footerWrap} fixed>
      <View style={styles.footerGrid}>
        <View style={[styles.footerCol, { marginRight: 10 }]}>
          <Text style={styles.footerSmall}>
            We hereby certify that the policy satisfies the requirements of the relevant law applicable in Great Britain,
            Northern Ireland, the Isle of Man, and the islands of Alderney, Guernsey and Jersey.
          </Text>

          <Text style={[styles.footerMuted, { marginTop: 5 }]}>
            Coverza Limited is authorised by the Gibraltar Financial Services Commission to carry on insurance
            business under the Financial Services Act 2019 and Financial Services Regulations 2020, registered address
            5/5 Crutchett’s Ramp, Gibraltar.
          </Text>
        </View>

        <View style={styles.footerCol}>
          <Text style={styles.footerSmall}>
            Details about our regulation by the Financial Conduct Authority and Prudential Regulation Authority are
            available on request.
          </Text>

          <View style={styles.sigBlock}>
            <Image style={styles.sigImg} src={sigSrc} />
            <Text style={styles.sigName}>Emma Huntington, for the Authorised Insurers</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.footerMuted, { marginTop: 6 }]}>
        Registered in England and Wales as ACCELERANT INSURANCE UK LIMITED. Reg. No. 03326800. Registered Address: One,
        Fleet Place, London, England, EC4M 7WS. Authorised and regulated by the Financial Conduct Authority (207658).
      </Text>
    </View>
  );
}

function KV({ rows }: { rows: Array<[string, string]> }) {
  return (
    <View style={styles.kvWrap}>
      {rows.map(([k, v], i) => (
        <View key={`${k}-${i}`} style={i === 0 ? styles.kvRowFirst : styles.kvRow}>
          <Text style={styles.kvK}>{k}</Text>
          <Text style={styles.kvV}>{v || "—"}</Text>
        </View>
      ))}
    </View>
  );
}

function Item({ k, text }: { k: string; text: string }) {
  return (
    <View style={styles.itemRow} wrap={false}>
      <Text style={styles.itemKey}>{k}</Text>
      <Text style={styles.itemText}>{text}</Text>
    </View>
  );
}

function DeclIntro() {
  return (
    <>
      <Text style={styles.declTitle}>Temporary Insurance Declaration</Text>
      <Text style={styles.declIntro}>
        This is a copy of the declaration you agree to as part of purchasing insurance from Coverza. You confirm you
        meet the assumptions and eligibility criteria below. Failure to meet these criteria could invalidate your
        insurance. You must continue to meet them for the duration of the policy.
      </Text>
    </>
  );
}

function DeclarationPart1() {
  return (
    <View>
      <DeclIntro />

      <Text style={styles.groupTitle}>1. I declare that I (and any named driver):</Text>
      <Item k="a)" text="Are aged between 21 and 75 years of age;" />
      <Item k="b)" text="Hold a Full United Kingdom driving licence (unless cover is agreed for another licence type);" />
      <Item k="c)" text="Have been a permanent UK resident for the last 12 months (1 year);" />
      <Item k="d)" text="Are not aware of any pending prosecution or Police enquiry for any motoring offences;" />
      <Item k="e)" text="Have no more than six (6) penalty points for motoring convictions in the last three (3) years;" />
      <Item k="f)" text="Have not had any driving disqualifications in the last three (3) years;" />
      <Item k="g)" text="Have had no more than one (1) fault claim in the last three (3) years;" />
      <Item k="h)" text="Do not have any criminal convictions;" />
      <Item
        k="i)"
        text="Have not had a motor insurance policy cancelled, voided, refused, a premium increased, or had an insurer refuse to pay a claim;"
      />
      <Item
        k="j)"
        text="Do not reside at any of the following: Squat, Static Caravan, Caravan, Barge, House Boat or a No fixed Abode address;"
      />
      <Item
        k="k)"
        text="Have no additional occupations including part-time jobs outside of that disclosed for the purposes of obtaining this insurance;"
      />
      <Item
        k="l)"
        text="Are NOT Unemployed or a Professional Sportsperson; and do not have an occupation connected to Couriers, Entertainment Industry, Fast Food Delivery, or Parcel Delivery."
      />
    </View>
  );
}

function DeclarationPart2And3() {
  return (
    <View>
      <Text style={styles.groupTitle}>2. I declare that the vehicle:</Text>
      <Item k="a)" text="Will only be used by the main driver (or main driver and one additional driver where permitted)." />
      <Item k="b)" text="Will only be used for social, domestic and pleasure, or in person by you in connection with your work or business;" />
      <Item
        k="c)"
        text="Will not be used for hire and reward, courier/delivery, racing, pace-making, speed testing, competition, rallies, trials, track days, or use on the Nürburgring Nordschleife;"
      />
      <Item k="d)" text="Is not impounded by the police or any government or local authority;" />
      <Item k="e)" text="Will not be used to carry hazardous, corrosive or explosive goods;" />
      <Item k="f)" text="Has not been modified (except modifications for disabled drivers or manufacturer optional extras such as alloy wheels);" />
      <Item k="g)" text="Has no more than seven (7) seats and is right-hand drive only;" />
      <Item k="h)" text="Has a valid MOT certificate (if required by law), and is not SORN registered;" />
      <Item k="i)" text="Has not been previously recorded as a Category A or B insurance total loss;" />
      <Item k="j)" text="Is not Q plated;" />
      <Item k="k)" text="Is registered in Great Britain, Northern Ireland or the Isle of Man;" />
      <Item k="l)" text="Will be in the United Kingdom (UK) at the start of the policy and will not be exported during the policy period;" />
      <Item k="m)" text="Has a current market value not exceeding £65,000 (minimum vehicle value £1,000)." />

      <View style={styles.divider} />

      <Text style={styles.groupTitle}>3. Additional confirmations:</Text>
      <Item
        k="3."
        text="I am aware this temporary insurance policy cannot be used for Hire or Loan Vehicles (e.g. rentals, credit hire, or accident management/recovery vehicles)."
      />
      <Item
        k="4."
        text="I declare the Certificate of Motor Insurance and any other document will not be used as evidence of insurance for the release of a vehicle impounded or confiscated by the Police or Local Authority."
      />
      <Item k="5." text="I am aware that driving of other cars is not permitted under this policy." />
      <Item k="6." text="I am aware that no amendments, alterations or changes can be made to this policy or Certificate of Motor Insurance once issued." />
      <Item
        k="7."
        text="I have read and agree that the above conditions are met and that I have taken reasonable care not to make any misrepresentation of the information I have provided."
      />
    </View>
  );
}

function ProposalDoc(input: ProposalPdfInput) {
  const vehicle = [input.make, input.model].filter(Boolean).join(" ").trim() || "";
  const vehicleLine = `${input.vrm}${vehicle ? ` • ${vehicle}` : ""}${input.year ? ` • ${input.year}` : ""}`;

  return (
    <Document title={`Statement of Fact - ${input.policyNumber}`}>
      <Page size="A4" style={styles.page}>
        <Header />
        <Footer baseUrl={input.baseUrl} signatureUrl={input.signatureUrl ?? null} />

        <Text style={styles.h1}>Statement of Fact</Text>
        <Text style={styles.sub}>Important: Please read carefully.</Text>

        <View style={styles.columns}>
          {/* LEFT COLUMN */}
          <View style={styles.colLeft}>
            <View style={styles.section}>
              <Text style={styles.metaLine}>
                Policy number: <Text style={styles.metaStrong}>{input.policyNumber}</Text>
              </Text>
              <Text style={[styles.metaLine, { marginTop: 2 }]}>
                Vehicle: <Text style={styles.metaStrong}>{vehicleLine}</Text>
              </Text>
              <Text style={[styles.metaLine, { marginTop: 2 }]}>
                Start: <Text style={styles.metaStrong}>{formatLongUKDateTime(input.startAtISO)}</Text>
              </Text>
              <Text style={[styles.metaLine, { marginTop: 2 }]}>
                End: <Text style={styles.metaStrong}>{formatLongUKDateTime(input.endAtISO)}</Text>
              </Text>
              <Text style={[styles.metaLine, { marginTop: 2 }]}>
                Duration: <Text style={styles.metaStrong}>{durationHuman(input.durationMs)}</Text>
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Important</Text>
              <Text style={styles.para}>
                This Statement of Fact is a record of information given by you which has been used to assess the risk and
                decide terms and conditions of your contract of insurance. You must check this document and tell us
                straight away if any information is incorrect or incomplete.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Main driver</Text>
              <KV
                rows={[
                  ["Name", input.fullName],
                  ["Email", input.email],
                  ["Address", input.address],
                  ["Date of birth", formatLongUKDate(input.dobISO)],
                  ["Licence type", input.licenceType],
                ]}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle details</Text>
              <KV
                rows={[
                  ["Registration", input.vrm],
                  ["Make", input.make ?? "—"],
                  ["Model", input.model ?? "—"],
                  ["Year", input.year ?? "—"],
                  ["Cover", "Temporary motor insurance"],
                ]}
              />
            </View>
          </View>

          {/* RIGHT COLUMN */}
          <View style={styles.colRight}>
            <DeclarationPart1 />
          </View>
        </View>

        {/* UNDER COLUMNS (FULL WIDTH) */}
        <View style={styles.belowColumns}>
          <DeclarationPart2And3 />
        </View>
      </Page>
    </Document>
  );
}

export async function renderProposalPdf(input: ProposalPdfInput): Promise<Buffer> {
  return await renderToBuffer(<ProposalDoc {...input} />);
}
