import "server-only";

import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { site } from "@/content/site";
import { formatMoney, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";

/**
 * The payroll report sent to the bureau or accountant.
 *
 * Internal, not customer-facing, so unlike the quotation and invoice documents
 * this one DOES carry rates and gross pay — that is the whole point of it. It
 * is generated from payroll_report(), the same call the screen uses, so the
 * document and the dashboard can never disagree about what was in the week.
 *
 * Anything excluded is stated on the page rather than left to be noticed:
 * a report that quietly omits four unapproved shifts is worse than no report.
 */

const C = { obsidian: "#0A0A0A", graphite: "#171717", ivory: "#F3EFE8", stone: "#D8D0C5", copper: "#C96A32", muted: "#66615A", warn: "#B45309" };

const s = StyleSheet.create({
  page: { padding: 36, paddingBottom: 64, fontFamily: "Helvetica", fontSize: 8.5, color: C.graphite },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 },
  logo: { width: 140, height: 38 },
  docTitle: { fontFamily: "Helvetica-Bold", fontSize: 18, textAlign: "right", letterSpacing: 0.5 },
  docMeta: { textAlign: "right", color: C.muted, marginTop: 4, lineHeight: 1.5, fontSize: 8.5 },
  band: { backgroundColor: C.obsidian, color: C.ivory, padding: 12, marginBottom: 16, flexDirection: "row", justifyContent: "space-between" },
  bandLabel: { fontSize: 7, color: C.stone, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 3 },
  bandValue: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  warnBox: { borderWidth: 0.5, borderColor: C.warn, padding: 10, marginBottom: 14 },
  warnTitle: { fontFamily: "Helvetica-Bold", color: C.warn, marginBottom: 4, fontSize: 9 },
  siteHeading: { fontFamily: "Helvetica-Bold", fontSize: 9.5, marginTop: 14, marginBottom: 4, color: C.copper },
  th: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.graphite, paddingBottom: 4, marginBottom: 2 },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.stone, paddingVertical: 5 },
  trTotal: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.graphite, paddingTop: 6, marginTop: 2, fontFamily: "Helvetica-Bold" },
  thText: { fontSize: 7, color: C.muted, letterSpacing: 0.8, textTransform: "uppercase" },
  cName: { flex: 3.4 }, cNum: { flex: 1.5 },
  cRight: { flex: 1.3, textAlign: "right" }, cRightWide: { flex: 1.7, textAlign: "right" },
  muted: { color: C.muted },
  section: { marginTop: 18 },
  label: { fontSize: 7, color: C.copper, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 },
  footer: { position: "absolute", left: 36, right: 36, bottom: 24, borderTopWidth: 0.5, borderTopColor: C.stone, paddingTop: 8, fontSize: 7, color: C.muted, flexDirection: "row", justifyContent: "space-between" },
});

export type PayrollRow = {
  employee_id: string;
  employee_number: string;
  employee_name: string;
  site_name: string | null;
  standard_hours: string;
  overtime_hours: string;
  hourly_rate: string;
  overtime_rate: string;
  base_pay: string;
  overtime_pay: string;
  adjustments: string;
  gross_pay: string;
  expenses: string;
  timesheet_count: number;
};

export type PayrollUnapproved = {
  employee_name: string;
  site_name: string | null;
  sheets: number;
  hours: string;
  statuses: string;
};

export type PayrollPeriod = {
  name: string;
  start_date: string;
  end_date: string;
  pay_date: string | null;
  status: string;
};

const n = (v: string | number | null | undefined) => Number(v ?? 0);
const hrs = (v: string | number | null | undefined) => n(v).toFixed(2);
const eur = (v: string | number | null | undefined) => formatMoney(toPence(String(v ?? "0")));

function Totals(rows: PayrollRow[]) {
  return rows.reduce(
    (a, r) => ({
      standard: a.standard + n(r.standard_hours),
      overtime: a.overtime + n(r.overtime_hours),
      base: a.base + n(r.base_pay),
      ot: a.ot + n(r.overtime_pay),
      adj: a.adj + n(r.adjustments),
      gross: a.gross + n(r.gross_pay),
      expenses: a.expenses + n(r.expenses),
    }),
    { standard: 0, overtime: 0, base: 0, ot: 0, adj: 0, gross: 0, expenses: 0 },
  );
}

export async function renderPayrollReport(args: {
  period: PayrollPeriod;
  rows: PayrollRow[];
  unapproved: PayrollUnapproved[];
  organisationName: string;
  generatedBy: string;
}) {
  const { period, rows, unapproved, organisationName, generatedBy } = args;
  const totals = Totals(rows);
  const generatedAt = new Date();

  // Grouped by site so a bureau can see, and query, one kitchen at a time.
  const bySite = new Map<string, PayrollRow[]>();
  for (const r of rows) {
    const key = r.site_name ?? "No site recorded";
    bySite.set(key, [...(bySite.get(key) ?? []), r]);
  }

  const doc = (
    <Document title={`Payroll — ${period.name}`} author={organisationName} subject="Payroll report">
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image style={s.logo} src={`${site.url}/brand/logo-copper.png`} />
          <View>
            <Text style={s.docTitle}>PAYROLL</Text>
            <Text style={s.docMeta}>{organisationName}</Text>
            <Text style={s.docMeta}>Generated {formatDateUK(generatedAt.toISOString().slice(0, 10))} by {generatedBy}</Text>
          </View>
        </View>

        <View style={s.band}>
          <View>
            <Text style={s.bandLabel}>Period</Text>
            <Text style={s.bandValue}>{period.name}</Text>
          </View>
          <View>
            <Text style={s.bandLabel}>Dates</Text>
            <Text style={s.bandValue}>{formatDateUK(period.start_date)} — {formatDateUK(period.end_date)}</Text>
          </View>
          <View>
            <Text style={s.bandLabel}>Pay date</Text>
            <Text style={s.bandValue}>{period.pay_date ? formatDateUK(period.pay_date) : "Not set"}</Text>
          </View>
          <View>
            <Text style={s.bandLabel}>Employees</Text>
            <Text style={s.bandValue}>{rows.length}</Text>
          </View>
          <View>
            <Text style={s.bandLabel}>Total hours</Text>
            <Text style={s.bandValue}>{(totals.standard + totals.overtime).toFixed(2)}</Text>
          </View>
          <View>
            <Text style={s.bandLabel}>Gross pay</Text>
            <Text style={s.bandValue}>{eur(totals.gross)}</Text>
          </View>
        </View>

        {unapproved.length ? (
          <View style={s.warnBox}>
            <Text style={s.warnTitle}>
              Hours excluded from this report: {unapproved.reduce((a, u) => a + n(u.hours), 0).toFixed(2)} across{" "}
              {unapproved.reduce((a, u) => a + Number(u.sheets), 0)} timesheet(s)
            </Text>
            <Text style={s.muted}>
              These hours fall inside the period but had not been approved when the report was generated, so they are
              not in any figure below. They will appear in a later period once approved.
            </Text>
            {unapproved.map((u, i) => (
              <Text key={i} style={{ marginTop: 3 }}>
                {u.employee_name}
                {u.site_name ? ` · ${u.site_name}` : ""} — {hrs(u.hours)} hours, {u.sheets} sheet(s) ({u.statuses})
              </Text>
            ))}
          </View>
        ) : null}

        {[...bySite.entries()].map(([siteName, siteRows]) => {
          const t = Totals(siteRows);
          return (
            <View key={siteName} wrap={false}>
              <Text style={s.siteHeading}>{siteName}</Text>
              <View style={s.th}>
                <Text style={[s.thText, s.cName]}>Employee</Text>
                <Text style={[s.thText, s.cNum]}>Number</Text>
                <Text style={[s.thText, s.cRight]}>Sheets</Text>
                <Text style={[s.thText, s.cRight]}>Std hrs</Text>
                <Text style={[s.thText, s.cRight]}>OT hrs</Text>
                <Text style={[s.thText, s.cRight]}>Rate</Text>
                <Text style={[s.thText, s.cRight]}>OT rate</Text>
                <Text style={[s.thText, s.cRightWide]}>Base pay</Text>
                <Text style={[s.thText, s.cRightWide]}>OT pay</Text>
                <Text style={[s.thText, s.cRightWide]}>Adjust.</Text>
                <Text style={[s.thText, s.cRightWide]}>Gross</Text>
                <Text style={[s.thText, s.cRightWide]}>Expenses</Text>
              </View>
              {siteRows.map((r) => (
                <View key={r.employee_id} style={s.tr}>
                  <Text style={s.cName}>{r.employee_name}</Text>
                  <Text style={[s.cNum, s.muted]}>{r.employee_number}</Text>
                  <Text style={s.cRight}>{r.timesheet_count}</Text>
                  <Text style={s.cRight}>{hrs(r.standard_hours)}</Text>
                  <Text style={s.cRight}>{hrs(r.overtime_hours)}</Text>
                  <Text style={s.cRight}>{eur(r.hourly_rate)}</Text>
                  <Text style={s.cRight}>{eur(r.overtime_rate)}</Text>
                  <Text style={s.cRightWide}>{eur(r.base_pay)}</Text>
                  <Text style={s.cRightWide}>{eur(r.overtime_pay)}</Text>
                  <Text style={s.cRightWide}>{n(r.adjustments) ? eur(r.adjustments) : "—"}</Text>
                  <Text style={s.cRightWide}>{eur(r.gross_pay)}</Text>
                  <Text style={s.cRightWide}>{n(r.expenses) ? eur(r.expenses) : "—"}</Text>
                </View>
              ))}
              <View style={s.trTotal}>
                <Text style={s.cName}>{siteName} total</Text>
                <Text style={s.cNum} />
                <Text style={s.cRight} />
                <Text style={s.cRight}>{t.standard.toFixed(2)}</Text>
                <Text style={s.cRight}>{t.overtime.toFixed(2)}</Text>
                <Text style={s.cRight} />
                <Text style={s.cRight} />
                <Text style={s.cRightWide}>{eur(t.base)}</Text>
                <Text style={s.cRightWide}>{eur(t.ot)}</Text>
                <Text style={s.cRightWide}>{eur(t.adj)}</Text>
                <Text style={s.cRightWide}>{eur(t.gross)}</Text>
                <Text style={s.cRightWide}>{eur(t.expenses)}</Text>
              </View>
            </View>
          );
        })}

        <View style={s.section}>
          <Text style={s.label}>Period total</Text>
          <View style={s.th}>
            <Text style={[s.thText, s.cName]}>All sites</Text>
            <Text style={[s.thText, s.cNum]}>{rows.length} employees</Text>
            <Text style={[s.thText, s.cRight]} />
            <Text style={[s.thText, s.cRight]}>Std hrs</Text>
            <Text style={[s.thText, s.cRight]}>OT hrs</Text>
            <Text style={[s.thText, s.cRight]} />
            <Text style={[s.thText, s.cRight]} />
            <Text style={[s.thText, s.cRightWide]}>Base pay</Text>
            <Text style={[s.thText, s.cRightWide]}>OT pay</Text>
            <Text style={[s.thText, s.cRightWide]}>Adjust.</Text>
            <Text style={[s.thText, s.cRightWide]}>Gross</Text>
            <Text style={[s.thText, s.cRightWide]}>Expenses</Text>
          </View>
          <View style={s.trTotal}>
            <Text style={s.cName}>Total</Text>
            <Text style={s.cNum} />
            <Text style={s.cRight} />
            <Text style={s.cRight}>{totals.standard.toFixed(2)}</Text>
            <Text style={s.cRight}>{totals.overtime.toFixed(2)}</Text>
            <Text style={s.cRight} />
            <Text style={s.cRight} />
            <Text style={s.cRightWide}>{eur(totals.base)}</Text>
            <Text style={s.cRightWide}>{eur(totals.ot)}</Text>
            <Text style={s.cRightWide}>{eur(totals.adj)}</Text>
            <Text style={s.cRightWide}>{eur(totals.gross)}</Text>
            <Text style={s.cRightWide}>{eur(totals.expenses)}</Text>
          </View>
          <Text style={[s.muted, { marginTop: 8 }]}>
            Gross pay is base plus overtime plus adjustments. Expenses are reimbursements and are shown separately
            because they are not taxable pay. Figures include approved hours only.
          </Text>
        </View>

        <View style={s.footer} fixed>
          <Text>{organisationName} · Payroll · {period.name}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}

/** `OAR_PAYROLL_2026-09-15_2026-09-21.pdf` — sorts and reads sensibly in an inbox. */
export function payrollFileName(period: PayrollPeriod) {
  return `OAR_PAYROLL_${period.start_date}_${period.end_date}.pdf`;
}
