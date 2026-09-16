import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { loadReports } from "@/features/reports/queries";
import { runAlerts } from "@/features/reports/actions";
import { categoryLabel } from "@/features/expenses/schema";
import { PageHeader, Panel, Metric, EmptyState } from "@/components/dashboard/primitives";
import { ActionLink } from "@/components/dashboard/entity";
import { RedirectingAction } from "@/components/dashboard/redirecting-action";
import { RevenueChart, ConversionChart, CategoryBarChart, StackedCostChart } from "@/components/dashboard/charts";
import { QuoteBadge, StageBadge } from "@/lib/domain/badges";

import { formatMoney, toPence } from "@/lib/money";
import { str } from "@/lib/pagination";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Reports" };

const RANGES = [
  { value: "3", label: "3 months" }, { value: "6", label: "6 months" }, { value: "12", label: "12 months" },
];

const monthLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
};

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/reports");
  if (!ctx.can("reports.read")) redirect("/dashboard");
  const sp = await searchParams;
  const months = Number(str(sp.months)) || 12;
  const days = months * 30;
  const data = await loadReports(ctx, { months, days });

  const revenue = data.revenue.map((r) => ({ label: monthLabel(r.month), invoiced: toPence(r.invoiced_net), received: toPence(r.received) }));
  const conversion = data.conversion.map((r) => ({ label: monthLabel(r.month), sent: Number(r.sent), accepted: Number(r.accepted) }));
  const totalSent = data.conversion.reduce((n, r) => n + Number(r.sent), 0);
  const totalAccepted = data.conversion.reduce((n, r) => n + Number(r.accepted), 0);
  const conversionRate = totalSent > 0 ? Math.round((totalAccepted / totalSent) * 1000) / 10 : null;
  const acceptedValue = data.conversion.reduce((n, r) => n + toPence(r.accepted_value), 0);
  const invoicedTotal = data.revenue.reduce((n, r) => n + toPence(r.invoiced_net), 0);
  const receivedTotal = data.revenue.reduce((n, r) => n + toPence(r.received), 0);
  const outstandingTotal = data.debt.reduce((n, r) => n + toPence(r.balance), 0);
  const hasData = invoicedTotal > 0 || totalSent > 0 || data.profitability.length > 0;

  const href = (m: string) => `/dashboard/reports?months=${m}`;
  const exportHref = (report: string) => `/dashboard/reports/${report}/export?from=${data.range.from}&to=${data.range.to}`;

  return (
    <>
      <PageHeader eyebrow="Insight" title="Reports" description={`Live figures from your own records over the last ${months} months.`}
        actions={ctx.can("org.manage") ? <RedirectingAction action={runAlerts} label="Run alert check" /> : null} />

      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-light">Period</span>
        {RANGES.map((r) => (
          <Link key={r.value} href={href(r.value)} className={cn("rounded-full px-3 py-1", String(months) === r.value ? "bg-obsidian text-ivory" : "border border-graphite/25")}>{r.label}</Link>
        ))}
      </div>

      {data.errors.length ? <p role="alert" className="mb-6 rounded-md bg-status-danger/10 px-4 py-3 text-sm text-status-danger">Some reports couldn’t be loaded.</p> : null}

      {!hasData ? (
        <EmptyState title="Nothing to report yet" description="Reports fill in as you issue quotes, raise invoices and record costs. Nothing here is sample data." action={{ label: "Go to quotes", href: "/dashboard/quotes" }} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Metric label="Invoiced (net)" value={formatMoney(invoicedTotal, { showPence: false })} />
            <Metric label="Received" value={formatMoney(receivedTotal, { showPence: false })} />
            <Metric label="Outstanding" value={formatMoney(outstandingTotal, { showPence: false })} tone={outstandingTotal > 0 ? "warning" : "default"} href="/dashboard/invoices?status=outstanding" />
            <Metric label="Quote conversion" value={conversionRate === null ? "—" : `${conversionRate}%`} hint={`${totalAccepted} of ${totalSent} issued`} />
            <Metric label="Accepted quote value" value={formatMoney(acceptedValue, { showPence: false })} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="Revenue by month"><RevenueChart data={revenue} /></Panel>
            <Panel title="Quote conversion"><ConversionChart data={conversion} /></Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="Quotes by status">
              {data.quotes.length ? (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-graphite/10">
                    {data.quotes.map((q) => (
                      <tr key={q.status}>
                        <td className="py-2"><QuoteBadge status={q.status} /></td>
                        <td className="py-2 text-right num-lining">{q.quote_count}</td>
                        <td className="py-2 text-right num-lining">{formatMoney(toPence(q.value), { showPence: false })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-sm text-muted-light">No quotations in this period.</p>}
            </Panel>

            <Panel title="Outstanding debt by age">
              {data.debt.length ? (
                <CategoryBarChart data={data.debt.map((d) => ({ label: d.bucket, value: toPence(d.balance) }))} valueLabel="Balance" />
              ) : <p className="text-sm text-muted-light">Nothing outstanding — every issued invoice is settled.</p>}
            </Panel>
          </div>

          <Panel title="Project profitability" action={<><ActionLink href={exportHref("outstanding-invoices")} className="h-8 px-3 text-xs">Debt CSV</ActionLink><ActionLink href="/dashboard/projects" className="h-8 px-3 text-xs">All projects</ActionLink></>}>
            {data.profitability.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-light">
                    <tr><th className="py-2 pr-3 font-medium">Project</th><th className="py-2 pr-3 text-right font-medium">Contract</th><th className="py-2 pr-3 text-right font-medium">Actual cost</th><th className="py-2 pr-3 text-right font-medium">Committed</th><th className="py-2 pr-3 text-right font-medium">Labour</th><th className="py-2 pr-3 text-right font-medium">Forecast GP</th><th className="py-2 text-right font-medium">Margin</th></tr>
                  </thead>
                  <tbody className="divide-y divide-graphite/10">
                    {data.profitability.map((p) => {
                      const margin = p.forecast_margin_pct === null ? null : Number(p.forecast_margin_pct);
                      return (
                        <tr key={p.project_id}>
                          <td className="py-2 pr-3"><Link href={`/dashboard/projects/${p.project_id}/costs`} className="underline">{p.name}</Link><span className="block text-xs text-muted-light num-lining">{p.project_number}</span></td>
                          <td className="py-2 pr-3 text-right num-lining">{formatMoney(toPence(p.contract_value), { showPence: false })}</td>
                          <td className="py-2 pr-3 text-right num-lining">{formatMoney(toPence(p.actual_cost), { showPence: false })}</td>
                          <td className="py-2 pr-3 text-right num-lining text-muted-light">{formatMoney(toPence(p.committed_cost), { showPence: false })}</td>
                          <td className="py-2 pr-3 text-right num-lining text-muted-light">{formatMoney(toPence(p.labour_cost), { showPence: false })}</td>
                          <td className="py-2 pr-3 text-right num-lining">{formatMoney(toPence(p.forecast_gross_profit), { showPence: false })}</td>
                          <td className={cn("py-2 text-right num-lining", margin !== null && margin < 15 && "text-status-danger")}>{margin === null ? "—" : `${margin}%`}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-muted-light">No projects yet.</p>}
          </Panel>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="Revenue by client">
              {data.clients.length ? (
                <CategoryBarChart data={data.clients.slice(0, 8).map((c) => ({ label: c.client_name, value: toPence(c.invoiced_net) }))} valueLabel="Invoiced (net)" />
              ) : <p className="text-sm text-muted-light">No invoiced revenue in this period.</p>}
            </Panel>
            <Panel title="Costs by category" action={<ActionLink href={exportHref("project-costs")} className="h-8 px-3 text-xs">CSV</ActionLink>}>
              {data.costs.length ? (
                <StackedCostChart data={data.costs.map((c) => ({ label: categoryLabel(c.category), committed: toPence(c.committed), actual: toPence(c.actual) }))} />
              ) : <p className="text-sm text-muted-light">No costs recorded in this period.</p>}
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="Labour cost by project">
              {data.labour.length ? (
                <CategoryBarChart data={data.labour.slice(0, 8).map((l) => ({ label: l.name, value: toPence(l.labour_cost) }))} valueLabel="Labour cost" />
              ) : <p className="text-sm text-muted-light">No approved timesheets in this period.</p>}
            </Panel>
            <Panel title="Employee hours" action={<ActionLink href={exportHref("hours-by-employee")} className="h-8 px-3 text-xs">CSV</ActionLink>}>
              {data.employees.length ? (
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-light"><tr><th className="py-2 pr-3 font-medium">Employee</th><th className="py-2 pr-3 text-right font-medium">Hours</th><th className="py-2 pr-3 text-right font-medium">Overtime</th><th className="py-2 text-right font-medium">Cost</th></tr></thead>
                  <tbody className="divide-y divide-graphite/10">
                    {data.employees.map((e) => (
                      <tr key={e.employee_id}>
                        <td className="py-2 pr-3"><Link href={`/dashboard/employees/${e.employee_id}/timesheets`} className="underline">{e.full_name}</Link></td>
                        <td className="py-2 pr-3 text-right num-lining">{Number(e.hours).toFixed(2)}</td>
                        <td className="py-2 pr-3 text-right num-lining">{Number(e.overtime).toFixed(2)}</td>
                        <td className="py-2 text-right num-lining">{formatMoney(toPence(e.labour_cost), { showPence: false })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-sm text-muted-light">No approved timesheets in this period.</p>}
            </Panel>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="Invoice approval chain" action={<ActionLink href={exportHref("invoice-pipeline")} className="h-8 px-3 text-xs">CSV</ActionLink>}>
              {data.pipeline.length ? (
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-light"><tr><th className="py-2 pr-3 font-medium">Stage</th><th className="py-2 pr-3 text-right font-medium">Invoices</th><th className="py-2 pr-3 text-right font-medium">Outstanding</th><th className="py-2 text-right font-medium">Oldest</th></tr></thead>
                  <tbody className="divide-y divide-graphite/10">
                    {data.pipeline.map((p) => (
                      <tr key={p.stage}>
                        <td className="py-2 pr-3"><StageBadge stage={p.stage} /></td>
                        <td className="py-2 pr-3 text-right num-lining">{p.invoice_count}</td>
                        <td className="py-2 pr-3 text-right num-lining">{formatMoney(toPence(p.value), { showPence: false })}</td>
                        <td className={cn("py-2 text-right num-lining", p.oldest_days > 21 && "text-status-danger")}>{p.oldest_days}d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-sm text-muted-light">No invoices in the approval chain.</p>}
            </Panel>

            <Panel title="How long clients take to pay" action={<ActionLink href={exportHref("payment-time")} className="h-8 px-3 text-xs">CSV</ActionLink>}>
              {data.paymentTime.length ? (
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-light"><tr><th className="py-2 pr-3 font-medium">Month</th><th className="py-2 pr-3 text-right font-medium">Invoices paid</th><th className="py-2 text-right font-medium">Average days</th></tr></thead>
                  <tbody className="divide-y divide-graphite/10">
                    {data.paymentTime.map((p) => (
                      <tr key={p.month}>
                        <td className="py-2 pr-3">{monthLabel(p.month)}</td>
                        <td className="py-2 pr-3 text-right num-lining">{p.invoices}</td>
                        <td className={cn("py-2 text-right num-lining", Number(p.avg_days) > 45 && "text-status-warning")}>{Number(p.avg_days).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-sm text-muted-light">No invoices settled yet.</p>}
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="Hours by site" action={<ActionLink href={exportHref("hours-by-site")} className="h-8 px-3 text-xs">CSV</ActionLink>}>
              {data.hoursBySite.length ? (
                <CategoryBarChart data={data.hoursBySite.map((h) => ({ label: h.site_name, value: toPence(h.labour_cost) }))} valueLabel="Labour cost" />
              ) : <p className="text-sm text-muted-light">No approved hours at any site in this period.</p>}
            </Panel>

            <Panel title="Vouchers and meals" action={<ActionLink href={exportHref("vouchers")} className="h-8 px-3 text-xs">CSV</ActionLink>}>
              {data.vouchers.length ? (
                <CategoryBarChart money={false} valueLabel="Meals"
                  data={Object.entries(data.vouchers.reduce<Record<string, number>>((acc, v) => {
                    acc[v.category_label] = (acc[v.category_label] ?? 0) + Number(v.quantity);
                    return acc;
                  }, {})).map(([label, value]) => ({ label, value }))} />
              ) : <p className="text-sm text-muted-light">Nothing logged in this period.</p>}
            </Panel>
          </div>

          <Panel title="Holiday and sickness" action={<ActionLink href={exportHref("absence")} className="h-8 px-3 text-xs">CSV</ActionLink>}>
            {data.absence.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-light">
                    <tr><th className="py-2 pr-3 font-medium">Employee</th><th className="py-2 pr-3 font-medium">Site</th><th className="py-2 pr-3 text-right font-medium">Holiday</th><th className="py-2 pr-3 text-right font-medium">Sick</th><th className="py-2 pr-3 text-right font-medium">Occasions</th><th className="py-2 text-right font-medium">Notes outstanding</th></tr>
                  </thead>
                  <tbody className="divide-y divide-graphite/10">
                    {data.absence.map((a) => (
                      <tr key={a.employee_id}>
                        <td className="py-2 pr-3"><Link href={`/dashboard/employees/${a.employee_id}/leave`} className="underline">{a.employee_name}</Link></td>
                        <td className="py-2 pr-3 text-muted-light">{a.site_name ?? "—"}</td>
                        <td className="py-2 pr-3 text-right num-lining">{Number(a.holiday_days)}</td>
                        <td className="py-2 pr-3 text-right num-lining">{Number(a.sick_days)}</td>
                        <td className="py-2 pr-3 text-right num-lining">{a.sick_occasions}</td>
                        <td className={cn("py-2 text-right num-lining", a.missing_notes > 0 && "text-status-warning")}>{a.missing_notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-muted-light">No absence recorded in this period.</p>}
          </Panel>
        </div>
      )}
    </>
  );
}
