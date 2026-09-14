import { requireOrgContext } from "@/lib/auth/context";
import { getProject } from "@/features/projects/queries";
import { projectFinancials, projectCostBreakdown, listEstimates, listExpenses } from "@/features/expenses/queries";
import { deleteEstimate } from "@/features/expenses/actions";
import { categoryLabel } from "@/features/expenses/schema";
import { Panel, Metric } from "@/components/dashboard/primitives";
import { ActionLink } from "@/components/dashboard/entity";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { DataTable } from "@/components/dashboard/data-table";
import { EstimateForm } from "@/components/dashboard/forms/expense-forms";
import { ExpenseBadge } from "@/lib/domain/badges";
import { formatGBP, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";

export default async function ProjectCostsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const [project, fin, breakdown, estimates, { rows }] = await Promise.all([getProject(ctx, id), projectFinancials(ctx, id), projectCostBreakdown(ctx, id), listEstimates(ctx, id), listExpenses(ctx, await searchParams, { projectId: id })]);
  if (!project) return null;
  const canWrite = ctx.can("projects.write") || ctx.can("finance.write") || (ctx.role === "project_manager" && project.project_manager_id === ctx.user.id);
  const path = `/dashboard/projects/${id}/costs`;
  const revenue = toPence(fin?.contract_value), est = toPence(fin?.estimated_cost), committed = toPence(fin?.committed_cost), actual = toPence(fin?.actual_cost);
  const pct = (n: number) => (revenue > 0 ? `${Math.round(((revenue - n) / revenue) * 1000) / 10}%` : "—");
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Metric label="Revenue (contract)" value={formatGBP(revenue, { showPence: false })} hint={`Invoiced ${formatGBP(toPence(fin?.invoiced_net), { showPence: false })}`} />
        <Metric label="Estimated cost" value={formatGBP(est, { showPence: false })} />
        <Metric label="Committed" value={formatGBP(committed, { showPence: false })} />
        <Metric label="Actual" value={formatGBP(actual, { showPence: false })} />
        <Metric label="Gross profit (forecast)" value={formatGBP(revenue - committed - actual, { showPence: false })} tone={revenue - committed - actual < revenue - est ? "warning" : "default"} hint={`Estimated ${formatGBP(revenue - est, { showPence: false })}`} />
        <Metric label="Margin (forecast)" value={pct(committed + actual)} hint={`Estimated ${pct(est)}`} />
      </div>

      <Panel title="Cost breakdown by category">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-light"><tr><th className="py-2 pr-3 font-medium">Category</th><th className="py-2 pr-3 text-right font-medium">Estimated</th><th className="py-2 pr-3 text-right font-medium">Committed</th><th className="py-2 pr-3 text-right font-medium">Actual</th><th className="py-2 text-right font-medium">Variance</th>{canWrite ? <th /> : null}</tr></thead>
            <tbody className="divide-y divide-graphite/10">
              {breakdown.filter((b) => Number(b.estimated) || Number(b.committed) || Number(b.actual)).map((b) => {
                const e = toPence(b.estimated), spent = toPence(b.committed) + toPence(b.actual), v = e - spent;
                return (
                  <tr key={b.category}>
                    <td className="py-2 pr-3">{categoryLabel(b.category)}</td>
                    <td className="py-2 pr-3 text-right num-lining">{formatGBP(e)}</td>
                    <td className="py-2 pr-3 text-right num-lining">{formatGBP(toPence(b.committed))}</td>
                    <td className="py-2 pr-3 text-right num-lining">{formatGBP(toPence(b.actual))}</td>
                    <td className={`py-2 text-right num-lining ${v < 0 ? "text-status-danger" : "text-status-success"}`}>{v < 0 ? "−" : ""}{formatGBP(Math.abs(v))}</td>
                    {canWrite ? <td className="py-2 text-right">{e ? <ConfirmAction action={deleteEstimate.bind(null, id, b.category)} label="Clear estimate" title="Clear this estimate?" confirmLabel="Clear" variant="outline" className="h-8 px-3 text-xs" /> : null}</td> : null}
                  </tr>
                );
              })}
              {!breakdown.some((b) => Number(b.estimated) || Number(b.committed) || Number(b.actual)) ? <tr><td colSpan={6} className="py-4 text-sm text-muted-light">No estimates or costs yet. Estimates are seeded automatically when an accepted quote is converted.</td></tr> : null}
            </tbody>
          </table>
        </div>
        {canWrite ? <div className="mt-5 border-t border-graphite/10 pt-4"><EstimateForm projectId={id} existing={estimates} /></div> : null}
      </Panel>

      <Panel title="Costs" action={canWrite ? <ActionLink href={`/dashboard/expenses/new?project=${id}&return=${encodeURIComponent(path)}`} variant="copper">Record cost</ActionLink> : undefined}>
        <DataTable rows={rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/expenses/${r.id}`}
          columns={[
            { key: "d", header: "Date", render: (r) => formatDateUK(r.expense_date) },
            { key: "desc", header: "Description", render: (r) => <span>{r.description}{r.supplier_name ? <span className="block text-xs text-muted-light">{r.supplier_name}</span> : null}</span> },
            { key: "c", header: "Category", render: (r) => categoryLabel(r.category) },
            { key: "s", header: "Status", render: (r) => <ExpenseBadge status={r.status} /> },
            { key: "n", header: "Net", align: "right", render: (r) => formatGBP(toPence(r.net)) },
          ]}
          empty={{ title: "No costs recorded against this project" }} />
      </Panel>
    </div>
  );
}
