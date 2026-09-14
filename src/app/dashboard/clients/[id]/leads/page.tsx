import { requireOrgContext } from "@/lib/auth/context";
import { listClientLeads } from "@/features/clients/queries";
import { DataTable } from "@/components/dashboard/data-table";
import { LeadBadge } from "@/lib/domain/badges";
import { formatGBP, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";

export default async function ClientLeadsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const rows = await listClientLeads(ctx, id);
  return (
    <DataTable rows={rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/leads/${r.id}`}
      columns={[
        { key: "title", header: "Lead", render: (r) => r.title },
        { key: "status", header: "Stage", render: (r) => <LeadBadge status={r.status} /> },
        { key: "value", header: "Est. value", align: "right", render: (r) => (r.estimated_value ? formatGBP(toPence(r.estimated_value), { showPence: false }) : "—") },
        { key: "created", header: "Created", render: (r) => formatDateUK(r.created_at) },
      ]}
      empty={{ title: "No leads for this client" }} />
  );
}
