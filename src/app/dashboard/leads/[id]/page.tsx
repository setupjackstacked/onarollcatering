import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getLead } from "@/features/leads/queries";
import { archiveLead } from "@/features/leads/actions";
import { listActivity, listNotes } from "@/features/shared/activity";
import { listEntityDocuments, documentCategories } from "@/features/documents/queries";
import { listMembers, memberLabel } from "@/features/shared/members";
import { listLeadSources, listServiceTypes } from "@/features/shared/lookups";
import { EntityHeader, DescriptionList, ActionLink } from "@/components/dashboard/entity";
import { Panel } from "@/components/dashboard/primitives";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { NotesPanel } from "@/components/dashboard/notes-panel";
import { DocumentsPanel } from "@/components/dashboard/documents";
import { LeadStatusForm } from "@/components/dashboard/forms/status-forms";
import { LeadBadge } from "@/lib/domain/badges";
import { formatGBP, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/leads/${id}`);
  if (!ctx.can("sales.read")) redirect("/dashboard");
  const lead = await getLead(ctx, id);
  if (!lead) notFound();
  const [activity, notes, docs, cats, members, sources, services] = await Promise.all([
    listActivity(ctx, "leads", id), listNotes(ctx, "lead", id), listEntityDocuments(ctx, "lead", id), documentCategories(ctx, "lead"), listMembers(ctx), listLeadSources(ctx), listServiceTypes(ctx),
  ]);
  const client = lead.clients as unknown as { id: string; name: string } | null;
  const contact = lead.client_contacts as unknown as { first_name: string; last_name: string; email: string | null; phone: string | null; mobile: string | null } | null;
  const canWrite = ctx.can("sales.write") || lead.assigned_user_id === ctx.user.id;
  const path = `/dashboard/leads/${id}`;

  return (
    <>
      <EntityHeader
        back={{ href: "/dashboard/leads", label: "Leads" }}
        eyebrow={`Lead · ${sources.find((s) => s.key === lead.source_key)?.label ?? lead.source_key}`}
        title={lead.title}
        badge={<LeadBadge status={lead.status} />}
        meta={<><span>{client ? <Link href={`/dashboard/clients/${client.id}`} className="underline">{client.name}</Link> : lead.company_name ?? "No company"}</span>{lead.estimated_value ? <span className="num-lining">{formatGBP(toPence(lead.estimated_value), { showPence: false })}</span> : null}<span>Assigned: {memberLabel(members.find((m) => m.user_id === lead.assigned_user_id))}</span></>}
        actions={
          <>
            {ctx.can("sales.write") ? <ActionLink href={`${path}/edit`}>Edit</ActionLink> : null}
            {ctx.can("projects.write") && !lead.converted_project_id && lead.status !== "lost" ? <ActionLink href={`${path}/convert`} variant="copper">Convert to project</ActionLink> : null}
            {ctx.can("sales.write") && !lead.converted_project_id ? <ConfirmAction action={archiveLead.bind(null, id)} label="Archive" title="Archive this lead?" description="It disappears from lists but is never deleted." confirmLabel="Archive" /> : null}
          </>
        }
      />

      {lead.converted_project_id ? (
        <p className="mb-6 rounded-md bg-status-success/10 px-4 py-3 text-sm text-status-success">Won — <Link href={`/dashboard/projects/${lead.converted_project_id}`} className="underline">open the project</Link>.</p>
      ) : canWrite ? (
        <Panel title="Stage" className="mb-6"><LeadStatusForm id={id} status={lead.status} /></Panel>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Details">
            <DescriptionList cols={3} items={[
              { label: "Services", value: lead.service_keys.map((k) => services.find((s) => s.key === k)?.label ?? k).join(", ") || null },
              { label: "Location", value: lead.project_location }, { label: "Expected start", value: lead.expected_start_date ? formatDateUK(lead.expected_start_date) : null },
              { label: "Created", value: formatDateUK(lead.created_at) }, { label: "Closed", value: lead.closed_at ? formatDateUK(lead.closed_at) : null }, { label: "Lost reason", value: lead.lost_reason },
            ]} />
            {lead.notes ? <p className="mt-5 whitespace-pre-wrap border-t border-graphite/10 pt-4 text-sm">{lead.notes}</p> : null}
          </Panel>
          <Panel title="Documents"><DocumentsPanel entityType="lead" entityId={id} documents={docs} categories={cats} canWrite={canWrite} revalidate={path} /></Panel>
          <NotesPanel entityType="lead" entityId={id} notes={notes} canWrite={canWrite && ctx.role !== "read_only"} currentUserId={ctx.user.id} revalidate={path} />
        </div>
        <div className="space-y-6">
          <Panel title="Contact">
            <DescriptionList cols={1} items={[
              { label: "Company", value: client ? <Link href={`/dashboard/clients/${client.id}`} className="underline">{client.name}</Link> : lead.company_name },
              { label: "Name", value: contact ? `${contact.first_name} ${contact.last_name}`.trim() : lead.contact_name },
              { label: "Email", value: (contact?.email ?? lead.contact_email) ? <a className="underline" href={`mailto:${contact?.email ?? lead.contact_email}`}>{contact?.email ?? lead.contact_email}</a> : null },
              { label: "Phone", value: contact?.mobile ?? contact?.phone ?? lead.contact_phone },
            ]} />
          </Panel>
          <Panel title="Activity"><ActivityTimeline rows={activity} /></Panel>
        </div>
      </div>
    </>
  );
}
