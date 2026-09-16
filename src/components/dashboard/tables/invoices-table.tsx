import { DataTable } from "@/components/dashboard/data-table";
import { InvoiceBadge } from "@/lib/domain/badges";
import { formatMoney, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";
import type { InvoiceStatus, InvoiceKind } from "@/lib/supabase/types";

export type InvoiceRow = { id: string; invoice_number: string; kind: InvoiceKind; title: string; status: InvoiceStatus; total: string; amount_paid: string; due_date: string | null; clients?: unknown };

export function InvoicesTable({ rows, showClient = true, empty }: { rows: InvoiceRow[]; showClient?: boolean; empty: { title: string; description?: string; action?: { label: string; href: string } } }) {
  return (
    <DataTable rows={rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/invoices/${r.id}`}
      columns={[
        { key: "n", header: "Invoice", render: (r) => <span className="num-lining">{r.invoice_number || "Draft"}{r.kind !== "standard" ? <span className="ml-2 text-xs text-muted-light">{r.kind.replace("_", " ")}</span> : null}</span> },
        { key: "t", header: "Title", render: (r) => r.title },
        ...(showClient ? [{ key: "c", header: "Client", render: (r: InvoiceRow) => (r.clients as { name: string } | null)?.name ?? "—" }] : []),
        { key: "s", header: "Status", render: (r) => <InvoiceBadge status={r.status} /> },
        { key: "v", header: "Total", align: "right", render: (r) => formatMoney(toPence(r.total)) },
        { key: "b", header: "Balance", align: "right", render: (r) => formatMoney(toPence(r.total) - toPence(r.amount_paid)) },
        { key: "d", header: "Due", render: (r) => formatDateUK(r.due_date) },
      ]}
      empty={empty} />
  );
}
