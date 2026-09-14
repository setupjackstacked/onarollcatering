import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listQuotes } from "@/features/quotes/queries";
import { expireQuotes } from "@/features/quotes/actions";
import { PageHeader } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ActionLink } from "@/components/dashboard/entity";
import { QuoteBadge } from "@/lib/domain/badges";
import { formatGBP, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";
import { pageHref } from "@/lib/query-string";

export const metadata = { title: "Quotes" };

export default async function QuotesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/quotes");
  if (!ctx.can("sales.read")) redirect("/dashboard");
  const sp = await searchParams;
  if (ctx.can("sales.write")) await expireQuotes();
  const { rows, total, page, size } = await listQuotes(ctx, sp);
  return (
    <>
      <PageHeader eyebrow="Sales" title="Quotes" actions={ctx.can("sales.write") ? <ActionLink href="/dashboard/quotes/new" variant="copper">New quote</ActionLink> : null} />
      <FilterBar filters={[{ name: "status", label: "All statuses", options: [{ value: "open", label: "Open (draft/sent)" }, { value: "draft", label: "Draft" }, { value: "sent", label: "Sent" }, { value: "viewed", label: "Viewed" }, { value: "accepted", label: "Accepted" }, { value: "rejected", label: "Rejected" }, { value: "expired", label: "Expired" }, { value: "superseded", label: "Superseded" }] }]} searchPlaceholder="Title or number" />
      <DataTable rows={rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/quotes/${r.id}`}
        columns={[
          { key: "n", header: "Quote", render: (r) => <span className="num-lining">{r.quote_number}{r.revision ? ` r${r.revision}` : ""}</span> },
          { key: "t", header: "Title", render: (r) => r.title },
          { key: "c", header: "Client", render: (r) => (r.clients as unknown as { name: string } | null)?.name ?? "—" },
          { key: "s", header: "Status", render: (r) => <QuoteBadge status={r.status} /> },
          { key: "v", header: "Total", align: "right", render: (r) => formatGBP(toPence(r.total)) },
          { key: "e", header: "Expires", render: (r) => formatDateUK(r.expiry_date) },
        ]}
        empty={{ title: "No quotes yet", description: "Create a quote from a lead, a client or here.", action: ctx.can("sales.write") ? { label: "New quote", href: "/dashboard/quotes/new" } : undefined }}
        pagination={{ page, size, total, hrefFor: pageHref("/dashboard/quotes", sp) }} />
    </>
  );
}
