import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listSites } from "@/features/sites/queries";
import { SITE_STATUSES, SITE_TYPES } from "@/features/clients/schema";
import { memberMap, memberLabel } from "@/features/shared/members";
import { PageHeader, Metric } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ActionLink } from "@/components/dashboard/entity";
import { SiteBadge } from "@/lib/domain/badges";
import { formatAddress, type Address } from "@/lib/domain/address";
import { pageHref } from "@/lib/query-string";

export const metadata = { title: "Sites" };

export default async function SitesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/sites");
  if (!ctx.can("sites.read")) redirect("/dashboard");
  const sp = await searchParams;
  const [{ rows, total, page, size }, mmap] = await Promise.all([listSites(ctx, sp), memberMap(ctx)]);
  const canCreate = ctx.can("sales.write") || ctx.can("sites.write");
  const kitchens = rows.filter((r) => r.site_type === "kitchen").length;
  const operating = rows.filter((r) => r.status === "operating").length;

  return (
    <>
      <PageHeader eyebrow="Operations" title="Sites"
        description="Every kitchen and site you operate. Staff are assigned here, and their timesheets, leave and vouchers roll up to it."
        actions={canCreate ? <ActionLink href="/dashboard/sites/new" variant="copper">Add site</ActionLink> : null} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Metric label="Sites" value={total} />
        <Metric label="Kitchens" value={kitchens} />
        <Metric label="Operating" value={operating} />
      </div>

      <FilterBar
        filters={[
          { name: "status", label: "Open sites", options: SITE_STATUSES },
          { name: "type", label: "All types", options: SITE_TYPES },
          { name: "mine", label: "All managers", options: [{ value: "1", label: "Sites I manage" }] },
        ]}
        searchPlaceholder="Site, postcode or site manager" />

      <DataTable rows={rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/sites/${r.id}`}
        columns={[
          { key: "name", header: "Site", render: (r) => <span>{r.name}<span className="block text-xs text-muted-light">{SITE_TYPES.find((t) => t.value === r.site_type)?.label}</span></span> },
          { key: "client", header: "Client", render: (r) => (r.clients as unknown as { name: string } | null)?.name ?? "—" },
          { key: "status", header: "Status", render: (r) => <SiteBadge status={r.status} /> },
          { key: "mgr", header: "Our manager", render: (r) => (r.oar_manager_id ? memberLabel(mmap.get(r.oar_manager_id)) : <span className="text-muted-light">Unassigned</span>) },
          { key: "contact", header: "Site contact", render: (r) => r.site_manager_name ?? <span className="text-muted-light">—</span> },
          { key: "address", header: "Address", render: (r) => formatAddress(r.address as Address) || r.postcode || "—" },
        ]}
        empty={{ title: "No sites yet", description: "Add your kitchens so staff, hours and vouchers have somewhere to belong.", action: canCreate ? { label: "Add site", href: "/dashboard/sites/new" } : undefined }}
        pagination={{ page, size, total, hrefFor: pageHref("/dashboard/sites", sp) }} />
    </>
  );
}
