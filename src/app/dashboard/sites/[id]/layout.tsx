import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getSite, siteCounts } from "@/features/sites/queries";
import { archiveSiteRecord } from "@/features/sites/actions";
import { memberMap, memberLabel } from "@/features/shared/members";
import { SITE_TYPES } from "@/features/clients/schema";
import { EntityHeader, ActionLink } from "@/components/dashboard/entity";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { SiteBadge } from "@/lib/domain/badges";
import { SiteTabs } from "./tabs";

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/sites/${id}`);
  if (!ctx.can("projects.read")) redirect("/dashboard");
  const [site, counts, mmap] = await Promise.all([getSite(ctx, id), siteCounts(ctx, id), memberMap(ctx)]);
  if (!site) notFound();
  const client = site.clients as unknown as { id: string; name: string } | null;
  const base = `/dashboard/sites/${id}`;
  const canEdit = ctx.can("sales.write") || ctx.can("projects.write");

  return (
    <>
      <EntityHeader
        back={{ href: "/dashboard/sites", label: "Sites" }}
        eyebrow={SITE_TYPES.find((t) => t.value === site.site_type)?.label ?? "Site"}
        title={site.name}
        badge={<SiteBadge status={site.status} />}
        meta={<>
          {client ? <Link href={`/dashboard/clients/${client.id}`} className="underline">{client.name}</Link> : null}
          {site.postcode ? <span>{site.postcode}</span> : null}
          {site.oar_manager_id ? <span>Managed by {memberLabel(mmap.get(site.oar_manager_id))}</span> : <span className="text-status-warning">No manager assigned</span>}
        </>}
        actions={<>
          {canEdit ? <ActionLink href={`${base}/edit`} variant="obsidian">Edit</ActionLink> : null}
          {ctx.can("org.manage") ? <ConfirmAction action={archiveSiteRecord.bind(null, id)} label="Close site" title="Close this site?" description="It stops appearing in pickers and rotas. Timesheets, vouchers and documents are kept." confirmLabel="Close site" /> : null}
        </>}
      />
      <SiteTabs base={base} counts={counts} />
      {children}
    </>
  );
}
