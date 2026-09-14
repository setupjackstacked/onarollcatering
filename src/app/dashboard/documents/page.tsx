import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { PageHeader } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { formatDateUK, isoDateOffset } from "@/lib/dates";
import { pageParams, str } from "@/lib/pagination";
import { pageHref } from "@/lib/query-string";
import type { DocumentEntity } from "@/lib/supabase/types";

export const metadata = { title: "Documents" };

const ENTITY_HREF: Record<string, (id: string) => string> = {
  client: (id) => `/dashboard/clients/${id}/documents`,
  project: (id) => `/dashboard/projects/${id}/documents`,
  lead: (id) => `/dashboard/leads/${id}`,
  employee: (id) => `/dashboard/employees/${id}`,
  supplier: (id) => `/dashboard/suppliers/${id}`,
  quote: (id) => `/dashboard/quotes/${id}`,
  invoice: (id) => `/dashboard/invoices/${id}`,
  site: (id) => `/dashboard/sites/${id}`,
};

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/documents");
  if (!ctx.can("projects.read")) redirect("/dashboard");
  const sp = await searchParams;
  const { from, to, page, size } = pageParams(sp);
  const q = str(sp.q), entity = str(sp.entity), expiring = str(sp.expiring);
  let query = ctx.supabase.from("documents").select("id, name, entity_type, entity_id, category_key, size_bytes, expiry_date, created_at", { count: "exact" }).eq("organisation_id", ctx.organisation.id).is("archived_at", null).order("created_at", { ascending: false }).range(from, to);
  if (q) query = query.ilike("name", `%${q}%`);
  if (entity) query = query.eq("entity_type", entity as DocumentEntity);
  if (expiring) query = query.not("expiry_date", "is", null).lte("expiry_date", isoDateOffset(90));
  const { data, count } = await query;
  return (
    <>
      <PageHeader eyebrow="Projects" title="Documents" description="Every file attached to a client, lead, project or site. Upload from the record itself." />
      <FilterBar filters={[
        { name: "entity", label: "All records", options: [{ value: "project", label: "Projects" }, { value: "client", label: "Clients" }, { value: "lead", label: "Leads" }, { value: "site", label: "Sites" }, { value: "employee", label: "Employees" }] },
        { name: "expiring", label: "Any expiry", options: [{ value: "1", label: "Expiring within 90 days" }] },
      ]} searchPlaceholder="File name" />
      <DataTable rows={data ?? []} rowKey={(r) => r.id}
        columns={[
          { key: "name", header: "File", render: (r) => <a href={`/api/documents/${r.id}`} className="font-medium underline-offset-4 hover:underline">{r.name}</a> },
          { key: "entity", header: "Attached to", render: (r) => <Link href={ENTITY_HREF[r.entity_type]?.(r.entity_id) ?? "#"} className="capitalize underline-offset-4 hover:underline">{r.entity_type}</Link> },
          { key: "cat", header: "Category", render: (r) => r.category_key.replace(/-/g, " ") },
          { key: "size", header: "Size", align: "right", render: (r) => `${(r.size_bytes / 1024 / 1024).toFixed(1)} MB` },
          { key: "expiry", header: "Expires", render: (r) => (r.expiry_date ? formatDateUK(r.expiry_date) : "—") },
          { key: "added", header: "Added", render: (r) => formatDateUK(r.created_at) },
        ]}
        empty={{ title: "No documents yet" }} pagination={{ page, size, total: count ?? 0, hrefFor: pageHref("/dashboard/documents", sp) }} />
    </>
  );
}
