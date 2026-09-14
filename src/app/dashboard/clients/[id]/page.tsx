import { requireOrgContext } from "@/lib/auth/context";
import { getClient, listContacts } from "@/features/clients/queries";
import { listNotes } from "@/features/shared/activity";
import { memberMap, memberLabel } from "@/features/shared/members";
import { DescriptionList } from "@/components/dashboard/entity";
import { Panel } from "@/components/dashboard/primitives";
import { NotesPanel } from "@/components/dashboard/notes-panel";
import { formatAddress, type Address } from "@/lib/domain/address";
import { formatDateUK } from "@/lib/dates";

export default async function ClientOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const [client, contacts, notes, mmap] = await Promise.all([getClient(ctx, id), listContacts(ctx, id), listNotes(ctx, "client", id), memberMap(ctx)]);
  if (!client) return null;
  const primary = contacts.find((c) => c.is_primary) ?? contacts[0];
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Panel title="Company">
          <DescriptionList cols={3} items={[
            { label: "Legal name", value: client.legal_name }, { label: "Company number", value: client.company_number }, { label: "VAT number", value: client.vat_number },
            { label: "Website", value: client.website ? <a href={client.website} className="underline" target="_blank" rel="noreferrer">{client.website}</a> : null },
            { label: "Account owner", value: memberLabel(client.owner_user_id ? mmap.get(client.owner_user_id) : null) }, { label: "Client since", value: formatDateUK(client.created_at) },
            { label: "Billing address", value: formatAddress(client.billing_address as Address) || null }, { label: "Trading address", value: formatAddress(client.trading_address as Address) || null },
          ]} />
          {client.notes ? <p className="mt-5 whitespace-pre-wrap border-t border-graphite/10 pt-4 text-sm">{client.notes}</p> : null}
        </Panel>
        <NotesPanel entityType="client" entityId={id} notes={notes} canWrite={ctx.can("sales.write")} currentUserId={ctx.user.id} revalidate={`/dashboard/clients/${id}`} />
      </div>
      <Panel title="Primary contact">
        {primary ? (
          <DescriptionList cols={1} items={[
            { label: "Name", value: `${primary.first_name} ${primary.last_name}`.trim() }, { label: "Job title", value: primary.job_title },
            { label: "Email", value: primary.email ? <a href={`mailto:${primary.email}`} className="underline">{primary.email}</a> : null },
            { label: "Phone", value: primary.mobile ?? primary.phone },
          ]} />
        ) : <p className="text-sm text-muted-light">No contacts yet.</p>}
      </Panel>
    </div>
  );
}
