import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { PageHeader } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { formatAddress, type Address } from "@/lib/domain/address";
import { pageParams, str } from "@/lib/pagination";
import { pageHref } from "@/lib/query-string";

export const metadata = { title: "Sites" };

export default async function SitesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/sites");
  if (!ctx.can("projects.read")) redirect("/dashboard");
  const sp = await searchParams;
  const { from, to, page, size } = pageParams(sp);
  const q = str(sp.q);
  let query = ctx.supabase.from("sites").select("id, name, postcode, address, client_id, clients(name)", { count: "exact" }).eq("organisation_id", ctx.organisation.id).is("archived_at", null).order("name").range(from, to);
  if (q) query = query.or(`name.ilike.%${q}%,postcode.ilike.%${q}%`);
  const { data, count } = await query;
  return (
    <>
      <PageHeader eyebrow="Projects" title="Sites" description="Sites belong to clients — add them from the client record." />
      <FilterBar filters={[]} searchPlaceholder="Site name or postcode" />
      <DataTable rows={data ?? []} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/sites/${r.id}`}
        columns={[
          { key: "name", header: "Site", render: (r) => r.name },
          { key: "client", header: "Client", render: (r) => (r.clients as unknown as { name: string } | null)?.name ?? "—" },
          { key: "address", header: "Address", render: (r) => formatAddress(r.address as Address) || "—" },
          { key: "postcode", header: "Postcode", render: (r) => r.postcode ?? "—" },
        ]}
        empty={{ title: "No sites yet" }} pagination={{ page, size, total: count ?? 0, hrefFor: pageHref("/dashboard/sites", sp) }} />
    </>
  );
}
