import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listExpenses, expenseTotals } from "@/features/expenses/queries";
import { COST_CATEGORIES, EXPENSE_STATUSES, categoryLabel } from "@/features/expenses/schema";
import { PageHeader, Metric } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ActionLink } from "@/components/dashboard/entity";
import { ExpenseBadge } from "@/lib/domain/badges";
import { formatGBP, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";
import { pageHref } from "@/lib/query-string";

export const metadata = { title: "Expenses" };

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/expenses");
  if (!ctx.can("finance.read") && ctx.role !== "project_manager") redirect("/dashboard");
  const sp = await searchParams;
  const [{ rows, total, page, size }, totals] = await Promise.all([listExpenses(ctx, sp), expenseTotals(ctx, sp)]);
  const canRaise = ctx.can("finance.write") || ctx.role === "project_manager";
  return (
    <>
      <PageHeader eyebrow="Finance" title="Expenses & costs" description="Project and overhead costs. Committed = agreed but not yet incurred; actual = incurred." actions={canRaise ? <ActionLink href="/dashboard/expenses/new" variant="copper">Record cost</ActionLink> : null} />
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Metric label="Pending approval" value={formatGBP(totals.pending, { showPence: false })} tone={totals.pending > 0 ? "warning" : "default"} href="/dashboard/expenses?status=pending" />
        <Metric label="Committed (net)" value={formatGBP(totals.committed, { showPence: false })} />
        <Metric label="Actual (net)" value={formatGBP(totals.actual, { showPence: false })} />
      </div>
      <FilterBar filters={[{ name: "status", label: "All statuses", options: EXPENSE_STATUSES as unknown as { value: string; label: string }[] }, { name: "category", label: "All categories", options: COST_CATEGORIES as unknown as { value: string; label: string }[] }]} searchPlaceholder="Description, reference or supplier" />
      <DataTable rows={rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/expenses/${r.id}`}
        columns={[
          { key: "d", header: "Date", render: (r) => formatDateUK(r.expense_date) },
          { key: "desc", header: "Description", render: (r) => { const sup = (r.suppliers as unknown as { name: string } | null)?.name ?? r.supplier_name; return <span>{r.description}{sup ? <span className="block text-xs text-muted-light">{sup}</span> : null}</span>; } },
          { key: "p", header: "Project", render: (r) => (r.projects as unknown as { name: string } | null)?.name ?? <span className="text-muted-light">Overhead</span> },
          { key: "c", header: "Category", render: (r) => categoryLabel(r.category) },
          { key: "s", header: "Status", render: (r) => <ExpenseBadge status={r.status} /> },
          { key: "n", header: "Net", align: "right", render: (r) => formatGBP(toPence(r.net)) },
          { key: "g", header: "Gross", align: "right", render: (r) => formatGBP(toPence(r.gross)) },
        ]}
        empty={{ title: "No costs recorded", description: "Record supplier invoices, purchase orders and other project costs here.", action: canRaise ? { label: "Record cost", href: "/dashboard/expenses/new" } : undefined }}
        pagination={{ page, size, total, hrefFor: pageHref("/dashboard/expenses", sp) }} />
    </>
  );
}
