import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getClient, clientCounts } from "@/features/clients/queries";
import { archiveClient } from "@/features/clients/actions";
import { EntityHeader, ActionLink } from "@/components/dashboard/entity";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { StatusBadge } from "@/components/dashboard/primitives";
import { ClientTabs } from "./tabs";

export default async function ClientLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/clients/${id}`);
  if (!ctx.can("sales.read")) redirect("/dashboard");
  const client = await getClient(ctx, id);
  if (!client) notFound();
  const counts = await clientCounts(ctx, id);
  const base = `/dashboard/clients/${id}`;
  return (
    <>
      <EntityHeader
        back={{ href: "/dashboard/clients", label: "Clients" }}
        eyebrow="Client"
        title={client.name}
        badge={client.archived_at ? <StatusBadge label="Archived" tone="grey" /> : null}
        meta={<>{client.email ? <span>{client.email}</span> : null}{client.phone ? <span>{client.phone}</span> : null}<span>{client.payment_terms_days}-day terms</span></>}
        actions={
          ctx.can("sales.write") ? (
            <>
              <ActionLink href={`${base}/edit`}>Edit</ActionLink>
              {client.archived_at ? (
                <ConfirmAction action={archiveClient.bind(null, id, true)} label="Restore" title="Restore this client?" variant="outline" confirmLabel="Restore" />
              ) : (
                <ConfirmAction action={archiveClient.bind(null, id, false)} label="Archive" title="Archive this client?" description="Projects, quotes and invoices are kept. The client is hidden from lists." confirmLabel="Archive" />
              )}
            </>
          ) : null
        }
      />
      <ClientTabs base={base} counts={counts} />
      {children}
    </>
  );
}

