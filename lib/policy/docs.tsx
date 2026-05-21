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
 * Proposal / Statement of Fact & Declaration
 * Clean Coverza branded PDF layout.
 * - Fixed compact header/footer
 * - No header overlap
 * - No rounded proposal pill
 * - Cleaner document-style layout
 * - Stable tables that do not split awkwardly
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
  baseUrl: string;
  signatureUrl?: string | null;
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
const HEADER_H = 50;
const FOOTER_H = 84;
const PAGE_PADDING_X = 38;

// Brand constants
const BRAND = "#6c4cf3";
const BRAND_DARK = "#4f35d8";
const BRAND_DEEP = "#20124d";
const BRAND_SOFT = "#f5f2ff";
const BRAND_BORDER = "#ddd3ff";
const INK = "#111827";
const TEXT = "#334155";
const MUTED = "#64748b";
const SOFT_TEXT = "#94a3b8";
const LINE = "#e6e0ff";
const CARD = "#ffffff";

const styles = StyleSheet.create({
  page: {
    fontSize: 8.7,
    color: INK,
    lineHeight: 1.22,
    paddingTop: HEADER_H + 18,
    paddingBottom: FOOTER_H + 16,
    paddingHorizontal: PAGE_PADDING_X,
    backgroundColor: "#ffffff",
  },

  /* Header */
  headerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_H,
    backgroundColor: BRAND,
    paddingHorizontal: PAGE_PADDING_X,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
    justifyContent: "center",
  },
  brandText: {
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 1,
    fontWeight: 900,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.25,
  },
  brandTagline: {
    marginTop: 4,
    color: "#efeaff",
    fontSize: 6.5,
    lineHeight: 1,
    letterSpacing: 0.95,
    textTransform: "uppercase",
  },
  headerRight: {
    width: 190,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  headerRightText: {
    color: "#efeaff",
    fontSize: 6.7,
    lineHeight: 1,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  headerTitle: {
    marginTop: 4,
    color: "#ffffff",
    fontSize: 10,
    lineHeight: 1,
    fontWeight: 900,
    fontFamily: "Helvetica-Bold",
  },

  /* Footer */
  footerWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: FOOTER_H,
    paddingHorizontal: PAGE_PADDING_X,
    paddingTop: 7,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: BRAND_BORDER,
    backgroundColor: BRAND_SOFT,
  },
  footerGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  footerLeft: {
    width: "58%",
    paddingRight: 12,
  },
  footerRight: {
    width: "42%",
  },
  footerSmall: {
    fontSize: 6.4,
    color: TEXT,
    lineHeight: 1.13,
  },
  footerMuted: {
    fontSize: 6.35,
    color: MUTED,
    lineHeight: 1.13,
  },
  sigRow: {
    marginTop: 3,
  },
  sigImg: {
    width: 78,
    height: 18,
    objectFit: "contain",
  },
  sigName: {
    marginTop: 1,
    fontSize: 6.35,
    color: INK,
    fontWeight: 900,
  },
  footerBottom: {
    marginTop: 4,
    fontSize: 6.15,
    color: MUTED,
    lineHeight: 1.1,
  },

  /* Top title area */
  titleBlock: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  titleTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  titleLeft: {
    flex: 1,
    paddingRight: 18,
  },
  kicker: {
    color: BRAND_DARK,
    fontSize: 7.4,
    fontWeight: 900,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  h1: {
    fontSize: 19,
    lineHeight: 1.05,
    fontWeight: 900,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.45,
    color: BRAND_DEEP,
    marginBottom: 5,
  },
  sub: {
    fontSize: 8.3,
    color: MUTED,
    lineHeight: 1.3,
  },
  policyBox: {
    width: 150,
    borderLeftWidth: 3,
    borderLeftColor: BRAND,
    paddingLeft: 10,
    paddingVertical: 2,
  },
  policyLabel: {
    color: SOFT_TEXT,
    fontSize: 6.9,
    fontWeight: 900,
    letterSpacing: 0.75,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  policyValue: {
    color: INK,
    fontSize: 9.4,
    fontWeight: 900,
    marginBottom: 8,
  },

  summaryWrap: {
    marginTop: 11,
    padding: 10,
    borderRadius: 10,
    backgroundColor: BRAND_SOFT,
    borderWidth: 1,
    borderColor: BRAND_BORDER,
  },
  summaryVehicle: {
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
  },
  summaryCol: {
    width: "33.333%",
    paddingRight: 9,
  },
  summaryLabel: {
    color: BRAND_DARK,
    fontSize: 6.85,
    fontWeight: 900,
    letterSpacing: 0.75,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  summaryValue: {
    color: INK,
    fontSize: 8.2,
    fontWeight: 800,
    lineHeight: 1.25,
  },

  /* Main content */
  sectionCard: {
    padding: 10,
    borderRadius: 9,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 11,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 900,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
    color: BRAND_DARK,
  },
  para: {
    color: TEXT,
    lineHeight: 1.3,
    fontSize: 8.45,
  },

  detailGrid: {
    flexDirection: "row",
    marginBottom: 12,
  },
  detailColLeft: {
    width: "50%",
    paddingRight: 7,
  },
  detailColRight: {
    width: "50%",
    paddingLeft: 7,
  },

  /* Key-value table */
  kvWrap: {
    borderWidth: 1,
    borderColor: BRAND_BORDER,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: CARD,
  },
  kvRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: LINE,
  },
  kvRowFirst: {
    flexDirection: "row",
  },
  kvK: {
    width: "39%",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: BRAND_SOFT,
    color: BRAND_DARK,
    fontSize: 7.7,
    fontWeight: 900,
  },
  kvV: {
    width: "61%",
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 8.05,
    color: INK,
    fontWeight: 800,
    lineHeight: 1.18,
  },

  /* Declaration */
  declIntroBlock: {
    marginBottom: 9,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  declTitle: {
    fontSize: 10.6,
    lineHeight: 1.15,
    fontWeight: 900,
    fontFamily: "Helvetica-Bold",
    color: BRAND_DARK,
    marginBottom: 5,
  },
  declIntro: {
    fontSize: 8.25,
    color: TEXT,
    lineHeight: 1.28,
  },
  declGroup: {
    marginBottom: 9,
  },
  groupTitle: {
    fontSize: 9.4,
    fontWeight: 900,
    fontFamily: "Helvetica-Bold",
    color: BRAND_DEEP,
    marginBottom: 5,
  },
  itemRow: {
    flexDirection: "row",
    marginBottom: 3.1,
  },
  itemKey: {
    width: 18,
    fontSize: 7.95,
    fontWeight: 900,
    color: BRAND_DARK,
  },
  itemText: {
    flex: 1,
    fontSize: 8.05,
    color: TEXT,
    lineHeight: 1.2,
  },
  divider: {
    marginTop: 7,
    marginBottom: 8,
    height: 1,
    backgroundColor: LINE,
  },
});

function Header() {
  return (
    <View style={styles.headerWrap} fixed>
      <View style={styles.headerLeft}>
        <Text style={styles.brandText}>Coverza</Text>
        <Text style={styles.brandTagline}>Coverage that connects</Text>
      </View>

      <View style={styles.headerRight}>
        <Text style={styles.headerRightText}>Proposal</Text>
        <Text style={styles.headerTitle}>Statement of Fact</Text>
      </View>
    </View>
  );
}

function Footer({
  baseUrl,
  signatureUrl,
}: {
  baseUrl: string;
  signatureUrl?: string | null;
}) {
  const sigSrc = signatureUrl
    ? signatureUrl.startsWith("http")
      ? signatureUrl
      : `${baseUrl}${signatureUrl}`
    : `${baseUrl}/brand/signature.png`;

  return (
    <View style={styles.footerWrap} fixed>
      <View style={styles.footerGrid}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerSmall}>
            We hereby certify that the policy satisfies the requirements of the relevant law applicable in Great Britain,
            Northern Ireland, the Isle of Man, and the islands of Alderney, Guernsey and Jersey.
          </Text>

          <Text style={[styles.footerMuted, { marginTop: 3 }]}>
            Coverza Limited is authorised by the Gibraltar Financial Services Commission to carry on insurance business
            under the Financial Services Act 2019 and Financial Services Regulations 2020.
          </Text>
        </View>

        <View style={styles.footerRight}>
          <Text style={styles.footerSmall}>
            Details about our regulation by the Financial Conduct Authority and Prudential Regulation Authority are
            available on request.
          </Text>

          <View style={styles.sigRow}>
            <Image style={styles.sigImg} src={sigSrc} />
            <Text style={styles.sigName}>Emma Huntington, for the Authorised Insurers</Text>
          </View>
        </View>
      </View>

      <Text style={styles.footerBottom}>
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
        <View key={`${k}-${i}`} style={i === 0 ? styles.kvRowFirst : styles.kvRow} wrap={false}>
          <Text style={styles.kvK}>{k}</Text>
          <Text style={styles.kvV}>{v || "—"}</Text>
        </View>
      ))}
    </View>
  );
}

function Item({ k, text }: { k: string; text: string }) {
  return (
    <View style={styles.itemRow}>
      <Text style={styles.itemKey}>{k}</Text>
      <Text style={styles.itemText}>{text}</Text>
    </View>
  );
}

function DeclarationIntro() {
  return (
    <View style={styles.declIntroBlock} wrap={false}>
      <Text style={styles.declTitle}>Temporary Insurance Declaration</Text>
      <Text style={styles.declIntro}>
        This is a copy of the declaration you agree to as part of purchasing insurance from Coverza. You confirm you
        meet the assumptions and eligibility criteria below. Failure to meet these criteria could invalidate your
        insurance. You must continue to meet them for the duration of the policy.
      </Text>
    </View>
  );
}

function DeclarationPart1() {
  return (
    <View style={styles.declGroup}>
      <Text style={styles.groupTitle}>1. I declare that I (and any named driver):</Text>
      <Item k="a)" text="Are aged between 17 and 75 years of age;" />
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
      <View style={styles.declGroup}>
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
      </View>

      <View style={styles.divider} />

      <View style={styles.declGroup}>
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

        <View style={styles.titleBlock} wrap={false}>
          <View style={styles.titleTopRow}>
            <View style={styles.titleLeft}>
              <Text style={styles.kicker}>Temporary motor insurance</Text>
              <Text style={styles.h1}>Statement of Fact</Text>
              <Text style={styles.sub}>
                Please read this document carefully. It records the information used to assess your temporary insurance.
              </Text>
            </View>

            <View style={styles.policyBox}>
              <Text style={styles.policyLabel}>Policy number</Text>
              <Text style={styles.policyValue}>{input.policyNumber}</Text>

              <Text style={styles.policyLabel}>Duration</Text>
              <Text style={styles.policyValue}>{durationHuman(input.durationMs)}</Text>
            </View>
          </View>

          <View style={styles.summaryWrap}>
            <View style={styles.summaryVehicle}>
              <Text style={styles.summaryLabel}>Vehicle</Text>
              <Text style={styles.summaryValue}>{vehicleLine}</Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>Starts</Text>
                <Text style={styles.summaryValue}>{formatLongUKDateTime(input.startAtISO)}</Text>
              </View>

              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>Ends</Text>
                <Text style={styles.summaryValue}>{formatLongUKDateTime(input.endAtISO)}</Text>
              </View>

              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>Cover</Text>
                <Text style={styles.summaryValue}>Temporary motor insurance</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.sectionTitle}>Important</Text>
          <Text style={styles.para}>
            This Statement of Fact is a record of information given by you which has been used to assess the risk and
            decide terms and conditions of your contract of insurance. You must check this document and tell us straight
            away if any information is incorrect or incomplete.
          </Text>
        </View>

        <View style={styles.detailGrid} wrap={false}>
          <View style={styles.detailColLeft}>
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

          <View style={styles.detailColRight}>
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

        <View>
          <DeclarationIntro />
          <DeclarationPart1 />
          <DeclarationPart2And3 />
        </View>
      </Page>
    </Document>
  );
}

export async function renderProposalPdf(input: ProposalPdfInput): Promise<Buffer> {
  return await renderToBuffer(<ProposalDoc {...input} />);
}