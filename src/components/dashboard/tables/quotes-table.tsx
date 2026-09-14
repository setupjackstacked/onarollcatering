import { DataTable } from "@/components/dashboard/data-table";
import { QuoteBadge } from "@/lib/domain/badges";
import { formatGBP, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";
import type { QuoteStatus } from "@/lib/supabase/types";

export type QuoteRow = { id: string; quote_number: string; revision: number; title: string; status: QuoteStatus; total: string; expiry_date: string; clients?: unknown };

export function QuotesTable({ rows, showClient = true, empty }: { rows: QuoteRow[]; showClient?: boolean; empty: { title: string; description?: string; action?: { label: string; href: string } } }) {
  return (
    <DataTable rows={rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/quotes/${r.id}`}
      columns={[
        { key: "n", header: "Quote", render: (r) => <span className="num-lining">{r.quote_number}{r.revision ? ` r${r.revision}` : ""}</span> },
        { key: "t", header: "Title", render: (r) => r.title },
        ...(showClient ? [{ key: "c", header: "Client", render: (r: QuoteRow) => (r.clients as { name: string } | null)?.name ?? "—" }] : []),
        { key: "s", header: "Status", render: (r) => <QuoteBadge status={r.status} /> },
        { key: "v", header: "Total", align: "right", render: (r) => formatGBP(toPence(r.total)) },
        { key: "e", header: "Expires", render: (r) => formatDateUK(r.expiry_date) },
      ]}
      empty={empty} />
  );
}
