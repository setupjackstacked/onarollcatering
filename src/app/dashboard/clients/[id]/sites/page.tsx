import { requireOrgContext } from "@/lib/auth/context";
import { listSites, listContacts } from "@/features/clients/queries";
import { archiveSite } from "@/features/clients/actions";
import { SiteForm } from "@/components/dashboard/forms/site-form";
import { Panel, EmptyState } from "@/components/dashboard/primitives";
import { ActionLink } from "@/components/dashboard/entity";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { formatAddress, type Address } from "@/lib/domain/address";
import { str } from "@/lib/pagination";

export default async function ClientSitesPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await requireOrgContext();
  const [sites, contacts] = await Promise.all([listSites(ctx, id), listContacts(ctx, id)]);
  const canWrite = ctx.can("sales.write") || ctx.can("projects.write");
  const editing = str(sp.edit);
  const adding = str(sp.new) === "1";
  const target = editing ? sites.find((s) => s.id === editing) : null;
  const base = `/dashboard/clients/${id}/sites`;
  const contactOpts = contacts.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}`.trim() }));

  return (
    <div className="space-y-6">
      {canWrite && (adding || target) ? (
        <Panel title={target ? "Edit site" : "New site"}><SiteForm clientId={id} site={target} contacts={contactOpts} /></Panel>
      ) : canWrite ? <div><ActionLink href={`${base}?new=1`} variant="copper">Add site</ActionLink></div> : null}
      {sites.length ? (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {sites.map((s) => (
            <li key={s.id} className="rounded-lg border border-graphite/10 bg-white/40 p-4">
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-muted-light">{formatAddress(s.address as Address) || "No address"}</p>
              {s.site_contact_id ? <p className="mt-1 text-sm">Contact: {contactOpts.find((c) => c.value === s.site_contact_id)?.label}</p> : null}
              {s.access_details ? <p className="mt-2 text-sm"><span className="text-muted-light">Access:</span> {s.access_details}</p> : null}
              {canWrite ? (
                <div className="mt-3 flex gap-2">
                  <ActionLink href={`${base}?edit=${s.id}`}>Edit</ActionLink>
                  <ConfirmAction action={archiveSite.bind(null, s.id, id)} label="Remove" title={`Remove ${s.name}?`} confirmLabel="Remove" />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : !adding ? <EmptyState title="No sites" description="A client can have many sites — compounds, offices, factories." /> : null}
    </div>
  );
}
