import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getSite } from "@/features/sites/queries";
import { listContacts } from "@/features/clients/queries";
import { listMembers, memberOptions } from "@/features/shared/members";
import { Panel } from "@/components/dashboard/primitives";
import { SiteForm } from "@/components/dashboard/forms/site-form";

export default async function EditSitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/sites/${id}/edit`);
  if (!ctx.can("sales.write") && !ctx.can("sites.write")) redirect(`/dashboard/sites/${id}`);
  const site = await getSite(ctx, id);
  if (!site) notFound();
  const [contacts, members] = await Promise.all([listContacts(ctx, site.client_id), listMembers(ctx)]);
  const managers = memberOptions(members.filter((m) => ["owner", "administrator", "project_manager"].includes(m.role)));
  return (
    <Panel title="Site details">
      <div className="max-w-3xl">
        <SiteForm clientId={site.client_id} site={site} managers={managers}
          contacts={contacts.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}`.trim() }))}
          returnTo={`/dashboard/sites/${id}`} />
      </div>
    </Panel>
  );
}
