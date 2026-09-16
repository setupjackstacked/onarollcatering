import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listInvoices, outstandingSummary } from "@/features/invoices/queries";
import { refreshOverdue } from "@/features/invoices/actions";
import { PageHeader, Metric } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ActionLink } from "@/components/dashboard/entity";
import { InvoiceBadge } from "@/lib/domain/badges";
import { formatMoney, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";
import { pageHref } from "@/lib/query-string";

export const metadata = { title: "Invoices" };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/invoices");
  if (!ctx.can("finance.read")) redirect("/dashboard");
  const sp = await searchParams;
  await refreshOverdue();
  const [{ rows, total, page, size }, summary] = await Promise.all([listInvoices(ctx, sp), outstandingSummary(ctx)]);
  return (
    <>
      <PageHeader eyebrow="Finance" title="Invoices" actions={ctx.can("finance.write") ? <ActionLink href="/dashboard/invoices/new" variant="copper">New invoice</ActionLink> : null} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Metric label="Outstanding" value={formatMoney(summary.outstanding, { showPence: false })} hint={`${summary.count} invoice${summary.count === 1 ? "" : "s"}`} />
        <Metric label="Overdue" value={formatMoney(summary.overdue, { showPence: false })} tone={summary.overdue > 0 ? "warning" : "default"} />
      </div>
      <FilterBar filters={[{ name: "status", label: "All statuses", options: [{ value: "outstanding", label: "Outstanding" }, { value: "draft", label: "Draft" }, { value: "issued", label: "Issued" }, { value: "part_paid", label: "Part paid" }, { value: "overdue", label: "Overdue" }, { value: "paid", label: "Paid" }, { value: "cancelled", label: "Cancelled" }, { value: "credit", label: "Credit notes" }] }]} searchPlaceholder="Number, title or reference" />
      <DataTable rows={rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/invoices/${r.id}`}
        columns={[
          { key: "n", header: "Invoice", render: (r) => <span className="num-lining">{r.invoice_number || "Draft"}{r.kind !== "standard" ? <span className="ml-2 text-xs text-muted-light">{r.kind.replace("_", " ")}</span> : null}</span> },
          { key: "t", header: "Title", render: (r) => r.title },
          { key: "c", header: "Client", render: (r) => (r.clients as unknown as { name: string } | null)?.name ?? "—" },
          { key: "s", header: "Status", render: (r) => <InvoiceBadge status={r.status} /> },
          { key: "v", header: "Total", align: "right", render: (r) => formatMoney(toPence(r.total)) },
          { key: "b", header: "Balance", align: "right", render: (r) => formatMoney(toPence(r.total) - toPence(r.amount_paid)) },
          { key: "d", header: "Due", render: (r) => formatDateUK(r.due_date) },
        ]}
        empty={{ title: "No invoices yet", description: "Raise invoices from accepted quotes or create one here.", action: ctx.can("finance.write") ? { label: "New invoice", href: "/dashboard/invoices/new" } : undefined }}
        pagination={{ page, size, total, hrefFor: pageHref("/dashboard/invoices", sp) }} />
    </>
  );
}
