import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { siteProfitAndLoss, sitesForTrading, saleForDay, sitesMissingSales } from "@/features/trading/queries";
import { PageHeader, Panel, Metric, StatusBadge } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { DailySalesForm } from "@/components/dashboard/forms/trading-forms";
import { formatMoney, toPence } from "@/lib/money";
import { formatDateUK, isoDateOffset } from "@/lib/dates";
import { str } from "@/lib/pagination";

export const metadata = { title: "Daily sales" };

/**
 * What the kitchens took, and what is left after running them.
 *
 * This is On A Roll's own trading position, not client invoicing — the client
 * approves the kitchen and its budget; the money here comes from the people
 * who eat there. A site manager sees their own kitchens and nobody else's,
 * which is decided in the database, not by this page.
 */
export default async function SalesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/sales");
  if (!ctx.can("trading.read")) redirect("/dashboard");
  const sp = await searchParams;

  const from = str(sp.from) || isoDateOffset(-30);
  const to = str(sp.to) || isoDateOffset(0);
  const day = str(sp.day) || isoDateOffset(-1);

  const [pl, sites, missing] = await Promise.all([
    siteProfitAndLoss(ctx, { from, to }),
    sitesForTrading(ctx),
    sitesMissingSales(ctx, day),
  ]);

  const siteId = str(sp.site) || sites[0]?.value || "";
  const existing = siteId ? await saleForDay(ctx, siteId, day) : null;

  const sum = (key: "revenue" | "total_cost" | "gross_profit") =>
    pl.reduce((n, r) => n + toPence(r[key]), 0);
  const revenue = sum("revenue");
  const profit = sum("gross_profit");
  const margin = revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : null;

  return (
    <>
      <PageHeader
        eyebrow="Trading"
        title="Daily sales"
        description={`Food sales and the cost of running each kitchen, ${formatDateUK(from)} to ${formatDateUK(to)}.`}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Food sales" value={formatMoney(revenue, { showPence: false })} />
        <Metric label="Cost to run" value={formatMoney(sum("total_cost"), { showPence: false })} />
        <Metric label="Gross profit" value={formatMoney(profit, { showPence: false })} tone={profit < 0 ? "warning" : "default"} />
        <Metric label="Margin" value={margin === null ? "—" : `${margin}%`} hint="Sales less food, labour and other costs" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {ctx.can("trading.write") && siteId ? (
          <Panel title={`Record ${formatDateUK(day)}`}>
            <p className="mb-4 text-sm text-muted-light">
              Enter what the kitchen took. Cash, card and anything charged to an account — the total should match
              the till before you leave.
            </p>
            <DailySalesForm
              siteId={siteId}
              sites={sites.length > 1 ? sites : undefined}
              date={day}
              existing={existing ? { cash: existing.cash, card: existing.card, account: existing.account, transactions: existing.transactions, notes: existing.notes } : null}
              locked={Boolean(existing?.confirmed_at)}
            />
          </Panel>
        ) : null}

        <div className="space-y-6 lg:col-span-2">
          {missing.length ? (
            <Panel title="Nothing recorded yet">
              <p className="text-sm text-muted-light">
                No takings for {formatDateUK(day)} at{" "}
                <strong>{missing.map((m) => m.site_name).join(", ")}</strong>. If the kitchen was closed, leave it —
                a day with no entry reads as closed rather than as zero.
              </p>
            </Panel>
          ) : null}

          <Panel title="By site">
            <DataTable
              rows={pl}
              rowKey={(r) => r.site_id}
              rowHref={(r) => `/dashboard/sites/${r.site_id}/sales`}
              columns={[
                { key: "s", header: "Kitchen", render: (r) => <span>{r.site_name}<span className="block text-xs text-muted-light">{Number(r.trading_days)} trading days</span></span> },
                { key: "r", header: "Sales", align: "right", render: (r) => <span className="num-lining">{formatMoney(toPence(r.revenue), { showPence: false })}</span> },
                { key: "f", header: "Food", align: "right", render: (r) => <span className="num-lining text-muted-light">{formatMoney(toPence(r.food_cost), { showPence: false })}</span> },
                { key: "l", header: "Labour", align: "right", render: (r) => <span className="num-lining text-muted-light">{formatMoney(toPence(r.labour_cost), { showPence: false })}</span> },
                { key: "g", header: "Gross profit", align: "right", render: (r) => <span className={`num-lining ${toPence(r.gross_profit) < 0 ? "text-status-danger" : ""}`}>{formatMoney(toPence(r.gross_profit), { showPence: false })}</span> },
                { key: "m", header: "Margin", align: "right", render: (r) => (r.margin_pct === null ? <span className="text-muted-light">—</span> : <span className="num-lining">{r.margin_pct}%</span>) },
                { key: "b", header: "Budget", align: "right", render: (r) => (toPence(r.budget) === 0 ? <span className="text-muted-light">Not set</span> : <StatusBadge label={toPence(r.budget_variance) >= 0 ? "Under" : "Over"} tone={toPence(r.budget_variance) >= 0 ? "green" : "red"} />) },
              ]}
              empty={{
                title: "Nothing recorded yet",
                description: "Once a kitchen records a day's takings, its trading position appears here.",
              }}
            />
            <p className="mt-4 text-xs text-muted-light">
              Labour comes from approved timesheets at the rate they were approved at, so it is zero until hourly
              rates are set on each employee. Food and other costs come from expenses tagged to the site.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
