import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getLead } from "@/features/leads/queries";
import { listMembers, memberOptions } from "@/features/shared/members";
import { listSiteOptions } from "@/features/shared/lookups";
import { EntityHeader } from "@/components/dashboard/entity";
import { Panel } from "@/components/dashboard/primitives";
import { ConvertLeadForm } from "@/components/dashboard/forms/status-forms";

export default async function ConvertLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/leads/${id}/convert`);
  if (!ctx.can("projects.write")) redirect(`/dashboard/leads/${id}`);
  const lead = await getLead(ctx, id);
  if (!lead) notFound();
  if (lead.converted_project_id) redirect(`/dashboard/projects/${lead.converted_project_id}`);
  const [members, sites] = await Promise.all([listMembers(ctx), lead.client_id ? listSiteOptions(ctx, lead.client_id) : Promise.resolve([])]);
  return (
    <div className="max-w-2xl">
      <EntityHeader back={{ href: `/dashboard/leads/${id}`, label: lead.title }} eyebrow="Convert to project" title={lead.title} />
      {!lead.client_id ? (
        <p className="mb-6 rounded-md bg-status-warning/10 px-4 py-3 text-sm">This lead isn’t linked to a client yet. <Link href={`/dashboard/leads/${id}/edit`} className="underline">Edit the lead</Link> and select or create the client first.</p>
      ) : null}
      <Panel title="Project details">
        <p className="mb-4 text-sm text-muted-light">Marks the lead as won, creates the project with the next project number, and moves any lead documents across.</p>
        <ConvertLeadForm id={id} title={lead.title} value={lead.estimated_value} start={lead.expected_start_date} sites={sites} members={memberOptions(members)} />
      </Panel>
    </div>
  );
}
