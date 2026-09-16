import Link from "next/link";
import { requireOrgContext } from "@/lib/auth/context";
import { getProject } from "@/features/projects/queries";
import { listNotes } from "@/features/shared/activity";
import { memberMap, memberLabel } from "@/features/shared/members";
import { listServiceTypes } from "@/features/shared/lookups";
import { DescriptionList } from "@/components/dashboard/entity";
import { Panel, Metric } from "@/components/dashboard/primitives";
import { NotesPanel } from "@/components/dashboard/notes-panel";
import { ProjectStatusForm } from "@/components/dashboard/forms/status-forms";
import { formatMoney, toPence, marginPct } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";
import { formatAddress, type Address } from "@/lib/domain/address";

export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const [project, notes, mmap, services] = await Promise.all([getProject(ctx, id), listNotes(ctx, "project", id), memberMap(ctx), listServiceTypes(ctx)]);
  if (!project) return null;
  const canWrite = ctx.can("projects.write") || (ctx.role === "project_manager" && project.project_manager_id === ctx.user.id);
  const value = toPence(project.contract_value), cost = toPence(project.estimated_cost);
  const margin = marginPct(value, cost);
  const site = project.sites as unknown as { id: string; name: string; postcode: string | null; address: Address } | null;
  return (
    <div className="space-y-6">
      {canWrite ? <Panel title="Status"><ProjectStatusForm id={id} status={project.status} /></Panel> : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Contract value" value={formatMoney(value, { showPence: false })} />
        <Metric label="Estimated cost" value={formatMoney(cost, { showPence: false })} />
        <Metric label="Est. gross profit" value={formatMoney(value - cost, { showPence: false })} />
        <Metric label="Est. margin" value={margin === null ? "—" : `${margin}%`} hint="Estimate — see Costs tab for actuals" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Details">
            <DescriptionList cols={3} items={[
              { label: "Project manager", value: memberLabel(project.project_manager_id ? mmap.get(project.project_manager_id) : null) },
              { label: "Start", value: project.start_date ? formatDateUK(project.start_date) : null }, { label: "End", value: project.end_date ? formatDateUK(project.end_date) : null },
              { label: "Services", value: project.service_keys.map((k) => services.find((s) => s.key === k)?.label ?? k).join(", ") || null },
              { label: "Site", value: site ? <>{site.name}{site.postcode ? ` · ${site.postcode}` : ""}<br /><span className="text-muted-light">{formatAddress(site.address)}</span></> : null },
              { label: "From lead", value: project.lead_id ? <Link href={`/dashboard/leads/${project.lead_id}`} className="underline">View lead</Link> : null },
            ]} />
            {project.description ? <p className="mt-5 whitespace-pre-wrap border-t border-graphite/10 pt-4 text-sm">{project.description}</p> : null}
          </Panel>
          <NotesPanel entityType="project" entityId={id} notes={notes} canWrite={canWrite} currentUserId={ctx.user.id} revalidate={`/dashboard/projects/${id}`} />
        </div>
        <Panel title="Internal notes">{project.notes ? <p className="whitespace-pre-wrap text-sm">{project.notes}</p> : <p className="text-sm text-muted-light">None</p>}</Panel>
      </div>
    </div>
  );
}
