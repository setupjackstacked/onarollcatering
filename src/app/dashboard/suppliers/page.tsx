import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listSuppliers } from "@/features/suppliers/queries";
import { SUPPLIER_CATEGORIES, supplierCategoryLabel } from "@/features/suppliers/schema";
import { PageHeader } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ActionLink } from "@/components/dashboard/entity";
import { pageHref } from "@/lib/query-string";

export const metadata = { title: "Suppliers" };

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/suppliers");
  if (!ctx.can("projects.read")) redirect("/dashboard");
  const sp = await searchParams;
  const { rows, total, page, size } = await listSuppliers(ctx, sp);
  const canWrite = ctx.can("finance.write");
  return (
    <>
      <PageHeader eyebrow="Supply chain" title="Suppliers" actions={canWrite ? <ActionLink href="/dashboard/suppliers/new" variant="copper">Add supplier</ActionLink> : null} />
      <FilterBar filters={[{ name: "category", label: "All categories", options: SUPPLIER_CATEGORIES as unknown as { value: string; label: string }[] }]} searchPlaceholder="Name, email or account" />
      <DataTable rows={rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/suppliers/${r.id}`}
        columns={[
          { key: "n", header: "Supplier", render: (r) => r.name },
          { key: "c", header: "Category", render: (r) => supplierCategoryLabel(r.category) },
          { key: "e", header: "Contact", render: (r) => <span className="text-muted-light">{r.email ?? r.phone ?? "—"}</span> },
          { key: "t", header: "Terms", render: (r) => `${r.payment_terms_days} days` },
        ]}
        empty={{ title: "No suppliers yet", description: "Record who you buy from so costs, equipment and purchase orders all point at the same company.", action: canWrite ? { label: "Add supplier", href: "/dashboard/suppliers/new" } : undefined }}
        pagination={{ page, size, total, hrefFor: pageHref("/dashboard/suppliers", sp) }} />
    </>
  );
}
