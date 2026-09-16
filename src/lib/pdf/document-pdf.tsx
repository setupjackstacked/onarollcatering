import "server-only";

import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { site } from "@/content/site";
import { formatMoney, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";
import type { Address } from "@/lib/domain/address";
import { formatAddress } from "@/lib/domain/address";

/**
 * Branded commercial document (quotation / invoice / credit note).
 * Customer-facing only: never receives cost prices. Fonts: Helvetica (built-in)
 * for reliability in serverless PDF generation; brand serif is used on the web.
 */

const C = { obsidian: "#0A0A0A", graphite: "#171717", ivory: "#F3EFE8", stone: "#D8D0C5", copper: "#C96A32", muted: "#66615A" };

const s = StyleSheet.create({
  page: { padding: 40, paddingBottom: 70, fontFamily: "Helvetica", fontSize: 9.5, color: C.graphite },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  logo: { width: 150, height: 41 },
  docTitle: { fontFamily: "Helvetica-Bold", fontSize: 20, textAlign: "right", letterSpacing: 0.5 },
  docMeta: { textAlign: "right", color: C.muted, marginTop: 4, lineHeight: 1.5 },
  band: { backgroundColor: C.obsidian, color: C.ivory, padding: 14, marginBottom: 18, flexDirection: "row", justifyContent: "space-between" },
  bandLabel: { fontSize: 7.5, color: C.stone, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 3 },
  bandValue: { fontSize: 10.5, fontFamily: "Helvetica-Bold" },
  two: { flexDirection: "row", gap: 24, marginBottom: 18 },
  col: { flex: 1 },
  label: { fontSize: 7.5, color: C.copper, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 },
  body: { lineHeight: 1.45 },
  table: { marginTop: 6 },
  th: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.graphite, paddingBottom: 5, marginBottom: 2 },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.stone, paddingVertical: 6 },
  thText: { fontSize: 7.5, color: C.muted, letterSpacing: 1, textTransform: "uppercase" },
  cDesc: { flex: 5 }, cQty: { flex: 1.2, textAlign: "right" }, cUnit: { flex: 1.3, textAlign: "right" }, cVat: { flex: 0.9, textAlign: "right" }, cNet: { flex: 1.6, textAlign: "right" },
  totals: { marginTop: 12, marginLeft: "auto", width: 240 },
  totRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totGrand: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.graphite, marginTop: 4, fontFamily: "Helvetica-Bold", fontSize: 12 },
  section: { marginTop: 18 },
  footer: { position: "absolute", left: 40, right: 40, bottom: 28, borderTopWidth: 0.5, borderTopColor: C.stone, paddingTop: 8, fontSize: 7.5, color: C.muted, flexDirection: "row", justifyContent: "space-between" },
  muted: { color: C.muted },
  status: { marginTop: 6, fontFamily: "Helvetica-Bold", color: C.copper, textAlign: "right" },
});

export type PdfLine = { description: string; quantity: string; unit: string; sell_price: string; discount_pct: string; vat_rate: string; line_net: string };
export type PdfDoc = {
  kind: "quotation" | "invoice" | "credit_note";
  number: string;
  revision?: number;
  title: string;
  status?: string;
  issueDate: string;
  secondaryDateLabel: string;
  secondaryDate: string | null;
  reference?: string | null;
  client: { name: string; address?: Partial<Address> | null; contact?: string | null };
  project?: string | null;
  lines: PdfLine[];
  subtotal: string;
  discountAmount: string;
  vatAmount: string;
  total: string;
  amountPaid?: string;
  scopeNotes?: string | null;
  terms?: string | null;
  paymentDetails?: string | null;
  logoUrl: string;
};

const money = (v: string) => formatMoney(toPence(v));

function DocPdf({ d }: { d: PdfDoc }) {
  const titleWord = d.kind === "quotation" ? "QUOTATION" : d.kind === "credit_note" ? "CREDIT NOTE" : "INVOICE";
  const balance = d.amountPaid !== undefined ? toPence(d.total) - toPence(d.amountPaid) : null;
  return (
    <Document title={`${titleWord} ${d.number}`} author={site.name}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={d.logoUrl} style={s.logo} />
          <View>
            <Text style={s.docTitle}>{titleWord}</Text>
            <Text style={s.docMeta}>{d.number}{d.revision ? `  ·  Revision ${d.revision}` : ""}</Text>
            {d.status && d.kind !== "quotation" && (d.status === "paid" || d.status === "overdue" || d.status === "cancelled") ? <Text style={s.status}>{d.status.toUpperCase()}</Text> : null}
          </View>
        </View>

        <View style={s.band}>
          <View><Text style={s.bandLabel}>{d.kind === "quotation" ? "Issued" : "Invoice date"}</Text><Text style={s.bandValue}>{formatDateUK(d.issueDate)}</Text></View>
          <View><Text style={s.bandLabel}>{d.secondaryDateLabel}</Text><Text style={s.bandValue}>{d.secondaryDate ? formatDateUK(d.secondaryDate) : "—"}</Text></View>
          {d.reference ? <View><Text style={s.bandLabel}>Your reference</Text><Text style={s.bandValue}>{d.reference}</Text></View> : null}
          <View><Text style={s.bandLabel}>Total{d.kind === "quotation" ? " (inc. VAT)" : ""}</Text><Text style={s.bandValue}>{money(d.total)}</Text></View>
        </View>

        <View style={s.two}>
          <View style={s.col}>
            <Text style={s.label}>{d.kind === "quotation" ? "Prepared for" : "Bill to"}</Text>
            <Text style={[s.body, { fontFamily: "Helvetica-Bold" }]}>{d.client.name}</Text>
            {d.client.contact ? <Text style={s.body}>{d.client.contact}</Text> : null}
            {d.client.address ? <Text style={[s.body, s.muted]}>{formatAddress(d.client.address, "\n")}</Text> : null}
          </View>
          <View style={s.col}>
            <Text style={s.label}>From</Text>
            <Text style={[s.body, { fontFamily: "Helvetica-Bold" }]}>{site.legalName}</Text>
            <Text style={[s.body, s.muted]}>{site.contact.address.lines.join("\n")}</Text>
            <Text style={[s.body, s.muted]}>{site.contact.email.display}{"\n"}{site.contact.phone.display}</Text>
            {site.vatNumber ? <Text style={[s.body, s.muted]}>VAT No. {site.vatNumber}</Text> : null}
          </View>
        </View>

        <Text style={s.label}>{d.kind === "quotation" ? "Scope" : "Details"}</Text>
        <Text style={[s.body, { fontSize: 11, marginBottom: 4 }]}>{d.title}</Text>
        {d.project ? <Text style={[s.body, s.muted]}>Project: {d.project}</Text> : null}

        <View style={s.table}>
          <View style={s.th}>
            <Text style={[s.thText, s.cDesc]}>Description</Text><Text style={[s.thText, s.cQty]}>Qty</Text><Text style={[s.thText, s.cUnit]}>Unit price</Text><Text style={[s.thText, s.cVat]}>VAT</Text><Text style={[s.thText, s.cNet]}>Net</Text>
          </View>
          {d.lines.map((l, i) => (
            <View key={i} style={s.tr} wrap={false}>
              <View style={s.cDesc}><Text>{l.description}</Text>{Number(l.discount_pct) > 0 ? <Text style={[s.muted, { fontSize: 8 }]}>{Number(l.discount_pct)}% discount applied</Text> : null}</View>
              <Text style={s.cQty}>{Number(l.quantity).toLocaleString("en-GB", { maximumFractionDigits: 3 })} {l.unit}</Text>
              <Text style={s.cUnit}>{money(l.sell_price)}</Text>
              <Text style={s.cVat}>{Number(l.vat_rate)}%</Text>
              <Text style={s.cNet}>{money(l.line_net)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals}>
          <View style={s.totRow}><Text style={s.muted}>Subtotal</Text><Text>{money(d.subtotal)}</Text></View>
          {toPence(d.discountAmount) > 0 ? <View style={s.totRow}><Text style={s.muted}>Discount</Text><Text>−{money(d.discountAmount)}</Text></View> : null}
          <View style={s.totRow}><Text style={s.muted}>VAT</Text><Text>{money(d.vatAmount)}</Text></View>
          <View style={s.totGrand}><Text>Total</Text><Text>{money(d.total)}</Text></View>
          {balance !== null && d.kind === "invoice" ? (
            <>
              <View style={s.totRow}><Text style={s.muted}>Paid</Text><Text>{money(d.amountPaid!)}</Text></View>
              <View style={s.totRow}><Text style={{ fontFamily: "Helvetica-Bold" }}>Balance due</Text><Text style={{ fontFamily: "Helvetica-Bold" }}>{formatMoney(balance)}</Text></View>
            </>
          ) : null}
        </View>

        {d.scopeNotes ? <View style={s.section}><Text style={s.label}>{d.kind === "quotation" ? "Scope notes" : "Notes"}</Text><Text style={s.body}>{d.scopeNotes}</Text></View> : null}
        {d.paymentDetails ? <View style={s.section}><Text style={s.label}>Payment</Text><Text style={s.body}>{d.paymentDetails}</Text></View> : null}
        {d.terms ? <View style={s.section}><Text style={s.label}>Terms</Text><Text style={[s.body, s.muted, { fontSize: 8.5 }]}>{d.terms}</Text></View> : null}

        <View style={s.footer} fixed>
          <Text>{site.legalName}{site.companyNumber ? ` · Company No. ${site.companyNumber}` : ""}</Text>
          <Text render={({ pageNumber, totalPages }) => `${d.number} · Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function renderDocumentPdf(d: PdfDoc): Promise<Buffer> {
  return renderToBuffer(<DocPdf d={d} />);
}
