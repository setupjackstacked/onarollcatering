import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listProjects } from "@/features/projects/queries";
import { listMembers, memberOptions, memberMap, memberLabel } from "@/features/shared/members";
import { listClientOptions } from "@/features/shared/lookups";
import { PageHeader } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ActionLink } from "@/components/dashboard/entity";
import { ProjectBadge } from "@/lib/domain/badges";
import { PROJECT_STATUSES } from "@/lib/domain/statuses";
import { formatMoney, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";
import { pageHref } from "@/lib/query-string";

export const metadata = { title: "Projects" };
type SP = Record<string, string | string[] | undefined>;

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireOrgContext("/dashboard/projects");
  if (!ctx.can("projects.read")) redirect("/dashboard");
  const sp = await searchParams;
  const [{ rows, total, page, size }, members, mmap, clients] = await Promise.all([listProjects(ctx, sp), listMembers(ctx), memberMap(ctx), listClientOptions(ctx)]);
  return (
    <>
      <PageHeader eyebrow="Projects" title="Projects" actions={ctx.can("projects.write") ? <ActionLink href="/dashboard/projects/new" variant="copper">New project</ActionLink> : null} />
      <FilterBar
        filters={[
          { name: "status", label: "All statuses", options: [{ value: "active", label: "Active" }, ...PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label }))] },
          { name: "pm", label: "Any PM", options: [{ value: "me", label: "Mine" }, ...memberOptions(members)] },
          { name: "client", label: "Any client", options: clients },
        ]}
        searchPlaceholder="Name or number"
      />
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        rowHref={(r) => `/dashboard/projects/${r.id}`}
        columns={[
          { key: "name", header: "Project", render: (r) => r.name },
          { key: "number", header: "Number", render: (r) => <span className="num-lining">{r.project_number}</span> },
          { key: "client", header: "Client", render: (r) => (r.clients as unknown as { name: string } | null)?.name ?? "—" },
          { key: "status", header: "Status", render: (r) => <ProjectBadge status={r.status} /> },
          { key: "pm", header: "PM", render: (r) => memberLabel(r.project_manager_id ? mmap.get(r.project_manager_id) : null) },
          { key: "start", header: "Start", render: (r) => (r.start_date ? formatDateUK(r.start_date) : "—") },
          { key: "value", header: "Contract", align: "right", render: (r) => formatMoney(toPence(r.contract_value), { showPence: false }) },
        ]}
        empty={{ title: "No projects match", description: "Projects are created here or by converting a won lead.", action: ctx.can("projects.write") ? { label: "New project", href: "/dashboard/projects/new" } : undefined }}
        pagination={{ page, size, total, hrefFor: pageHref("/dashboard/projects", sp) }}
      />
    </>
  );
}
