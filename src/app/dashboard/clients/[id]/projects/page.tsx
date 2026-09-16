import { requireOrgContext } from "@/lib/auth/context";
import { listClientProjects } from "@/features/clients/queries";
import { DataTable } from "@/components/dashboard/data-table";
import { ActionLink } from "@/components/dashboard/entity";
import { ProjectBadge } from "@/lib/domain/badges";
import { formatMoney, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";

export default async function ClientProjectsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const rows = await listClientProjects(ctx, id);
  return (
    <div className="space-y-4">
      {ctx.can("projects.write") ? <div><ActionLink href={`/dashboard/projects/new?client=${id}`} variant="copper">New project</ActionLink></div> : null}
      <DataTable rows={rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/projects/${r.id}`}
        columns={[
          { key: "name", header: "Project", render: (r) => r.name },
          { key: "number", header: "Number", render: (r) => r.project_number },
          { key: "status", header: "Status", render: (r) => <ProjectBadge status={r.status} /> },
          { key: "start", header: "Start", render: (r) => (r.start_date ? formatDateUK(r.start_date) : "—") },
          { key: "value", header: "Contract value", align: "right", render: (r) => formatMoney(toPence(r.contract_value), { showPence: false }) },
        ]}
        empty={{ title: "No projects for this client" }} />
    </div>
  );
}
