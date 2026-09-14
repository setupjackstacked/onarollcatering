import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getLead } from "@/features/leads/queries";
import { listContacts } from "@/features/clients/queries";
import { listMembers, memberOptions } from "@/features/shared/members";
import { listLeadSources, listServiceTypes, listClientOptions } from "@/features/shared/lookups";
import { EntityHeader } from "@/components/dashboard/entity";
import { LeadForm } from "@/components/dashboard/forms/lead-form";

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/leads/${id}/edit`);
  if (!ctx.can("sales.write")) redirect(`/dashboard/leads/${id}`);
  const lead = await getLead(ctx, id);
  if (!lead) notFound();
  const [members, sources, services, clients, contacts] = await Promise.all([
    listMembers(ctx), listLeadSources(ctx), listServiceTypes(ctx), listClientOptions(ctx), lead.client_id ? listContacts(ctx, lead.client_id) : Promise.resolve([]),
  ]);
  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: `/dashboard/leads/${id}`, label: lead.title }} eyebrow="Edit lead" title={lead.title} />
      <LeadForm lead={lead} clients={clients} members={memberOptions(members)} sources={sources.map((s) => ({ value: s.key, label: s.label }))} services={services.map((s) => ({ value: s.key, label: s.label }))} contacts={contacts.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}`.trim() }))} />
    </div>
  );
}
