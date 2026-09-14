import { requireOrgContext } from "@/lib/auth/context";
import { listContacts } from "@/features/clients/queries";
import { archiveContact } from "@/features/clients/actions";
import { ContactForm } from "@/components/dashboard/forms/contact-form";
import { Panel, StatusBadge, EmptyState } from "@/components/dashboard/primitives";
import { ActionLink } from "@/components/dashboard/entity";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { str } from "@/lib/pagination";

export default async function ClientContactsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await requireOrgContext();
  const contacts = await listContacts(ctx, id);
  const editing = str(sp.edit);
  const adding = str(sp.new) === "1";
  const canWrite = ctx.can("sales.write");
  const target = editing ? contacts.find((c) => c.id === editing) : null;
  const base = `/dashboard/clients/${id}/contacts`;

  return (
    <div className="space-y-6">
      {canWrite && (adding || target) ? (
        <Panel title={target ? "Edit contact" : "New contact"}><ContactForm clientId={id} contact={target} /></Panel>
      ) : canWrite ? (
        <div><ActionLink href={`${base}?new=1`} variant="copper">Add contact</ActionLink></div>
      ) : null}
      {contacts.length ? (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {contacts.map((c) => (
            <li key={c.id} className="rounded-lg border border-graphite/10 bg-white/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{c.first_name} {c.last_name}</p>
                  {c.job_title ? <p className="text-sm text-muted-light">{c.job_title}</p> : null}
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {c.is_primary ? <StatusBadge label="Primary" tone="copper" /> : null}
                  {c.is_finance ? <StatusBadge label="Finance" tone="blue" /> : null}
                  {c.is_project ? <StatusBadge label="Project" tone="grey" /> : null}
                </div>
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                {c.email ? <div><a href={`mailto:${c.email}`} className="underline">{c.email}</a></div> : null}
                {c.mobile ? <div>{c.mobile} <span className="text-xs text-muted-light">mobile</span></div> : null}
                {c.phone ? <div>{c.phone}</div> : null}
              </dl>
              {c.notes ? <p className="mt-2 text-sm text-muted-light">{c.notes}</p> : null}
              {canWrite ? (
                <div className="mt-3 flex gap-2">
                  <ActionLink href={`${base}?edit=${c.id}`}>Edit</ActionLink>
                  <ConfirmAction action={archiveContact.bind(null, c.id, id)} label="Remove" title={`Remove ${c.first_name}?`} confirmLabel="Remove" />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : !adding ? <EmptyState title="No contacts" description="Add the people you deal with at this client." /> : null}
    </div>
  );
}
