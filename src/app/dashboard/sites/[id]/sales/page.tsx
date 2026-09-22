import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { dailySales, siteProfitAndLoss, saleForDay, siteBudget } from "@/features/trading/queries";
import { confirmDailySales } from "@/features/trading/actions";
import { Panel, Metric, StatusBadge } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { DailySalesForm, SiteBudgetForm } from "@/components/dashboard/forms/trading-forms";
import { formatMoney, toPence } from "@/lib/money";
import { formatDateUK, isoDateOffset } from "@/lib/dates";
import { str } from "@/lib/pagination";

export const metadata = { title: "Sales" };

/** One kitchen's takings and trading position. */
export default async function SiteSalesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/sites/${id}/sales`);
  if (!ctx.can("trading.read")) redirect(`/dashboard/sites/${id}`);
  const sp = await searchParams;

  const from = str(sp.from) || isoDateOffset(-30);
  const to = str(sp.to) || isoDateOffset(0);
  const day = str(sp.day) || isoDateOffset(-1);
  const month = (str(sp.month) || to).slice(0, 7);

  const [rows, pl, existing, budget] = await Promise.all([
    dailySales(ctx, id, { from, to }),
    siteProfitAndLoss(ctx, { from, to }),
    saleForDay(ctx, id, day),
    ctx.can("finance.read") ? siteBudget(ctx, id, `${month}-01`) : Promise.resolve(null),
  ]);

  const mine = pl.find((p) => p.site_id === id);
  const profit = mine ? toPence(mine.gross_profit) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Metric label="Food sales" value={mine ? formatMoney(toPence(mine.revenue), { showPence: false }) : "—"} />
        <Metric label="Food cost" value={mine ? formatMoney(toPence(mine.food_cost), { showPence: false }) : "—"} />
        <Metric label="Labour" value={mine ? formatMoney(toPence(mine.labour_cost), { showPence: false }) : "—"} />
        <Metric label="Gross profit" value={mine ? formatMoney(profit, { showPence: false }) : "—"} tone={profit < 0 ? "warning" : "default"} />
        <Metric label="Margin" value={mine?.margin_pct == null ? "—" : `${mine.margin_pct}%`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {ctx.can("trading.write") ? (
          <Panel title={`Record ${formatDateUK(day)}`}>
            <DailySalesForm
              siteId={id}
              date={day}
              existing={existing ? { cash: existing.cash, card: existing.card, account: existing.account, transactions: existing.transactions, notes: existing.notes } : null}
              locked={Boolean(existing?.confirmed_at)}
            />
          </Panel>
        ) : null}

        <div className="space-y-6 lg:col-span-2">
          <Panel title="Day by day">
            <DataTable
              rows={rows}
              rowKey={(r) => r.sale_date}
              columns={[
                { key: "d", header: "Day", render: (r) => formatDateUK(r.sale_date) },
                { key: "c", header: "Cash", align: "right", render: (r) => formatMoney(toPence(r.cash)) },
                { key: "k", header: "Card", align: "right", render: (r) => formatMoney(toPence(r.card)) },
                { key: "a", header: "Account", align: "right", render: (r) => formatMoney(toPence(r.account)) },
                { key: "t", header: "Total", align: "right", render: (r) => <strong className="num-lining">{formatMoney(toPence(r.total))}</strong> },
                { key: "x", header: "", render: (r) => (r.confirmed
                  ? <StatusBadge label="Signed off" tone="green" />
                  : ctx.can("finance.write")
                    ? <ConfirmAction action={confirmDailySales.bind(null, id, r.sale_date)} label="Sign off" title={`Sign off ${formatDateUK(r.sale_date)}?`} description="The figures are then fixed. Only finance can reopen the day." confirmLabel="Sign off" />
                    : null) },
              ]}
              empty={{ title: "No takings recorded", description: "Record a day using the form to start building this kitchen's trading history." }}
            />
          </Panel>

          {ctx.can("finance.write") ? (
            <Panel title="Approved operating budget">
              <p className="mb-4 text-sm text-muted-light">
                What the client signed off for this kitchen. Actual spend is measured against it on the sales screen.
              </p>
              <SiteBudgetForm
                siteId={id}
                month={month}
                existing={budget ? {
                  food_budget: budget.food_budget, labour_budget: budget.labour_budget,
                  other_budget: budget.other_budget, revenue_target: budget.revenue_target,
                  approved_by_client: budget.approved_by_client, notes: budget.notes,
                } : null}
              />
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
