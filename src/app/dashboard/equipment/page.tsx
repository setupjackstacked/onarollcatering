import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listEquipment } from "@/features/suppliers/queries";
import { EQUIPMENT_CATEGORIES } from "@/features/suppliers/schema";
import { PageHeader, StatusBadge } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ActionLink } from "@/components/dashboard/entity";
import { formatGBP, toPence, marginPct } from "@/lib/money";
import { pageHref } from "@/lib/query-string";

export const metadata = { title: "Equipment" };

export default async function EquipmentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/equipment");
  if (!ctx.can("projects.read")) redirect("/dashboard");
  const sp = await searchParams;
  const { rows, total, page, size } = await listEquipment(ctx, sp);
  const canWrite = ctx.can("finance.write");
  const showCost = ctx.can("finance.read");
  return (
    <>
      <PageHeader eyebrow="Supply chain" title="Equipment catalogue" description="Specifications and pricing for the kit you design and install. Published items appear in the quotation line picker."
        actions={canWrite ? <ActionLink href="/dashboard/equipment/new" variant="copper">Add equipment</ActionLink> : null} />
      <FilterBar
        filters={[
          { name: "category", label: "All categories", options: EQUIPMENT_CATEGORIES },
          { name: "active", label: "Active", options: [{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }, { value: "all", label: "All" }] },
        ]}
        searchPlaceholder="Name, SKU or specification" />
      <DataTable rows={rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/equipment/${r.id}`}
        columns={[
          { key: "n", header: "Item", render: (r) => <span>{r.name}{r.supplier_sku ? <span className="block text-xs text-muted-light">SKU {r.supplier_sku}</span> : null}</span> },
          { key: "c", header: "Category", render: (r) => EQUIPMENT_CATEGORIES.find((c) => c.value === r.category)?.label ?? r.category },
          { key: "s", header: "Supplier", render: (r) => (r.suppliers as unknown as { name: string } | null)?.name ?? <span className="text-muted-light">—</span> },
          ...(showCost ? [{ key: "cp", header: "Cost", align: "right" as const, render: (r: typeof rows[number]) => <span className="text-muted-light">{formatGBP(toPence(r.cost_price))}</span> }] : []),
          { key: "sp", header: "Sell", align: "right", render: (r) => formatGBP(toPence(r.sell_price)) },
          ...(showCost ? [{ key: "m", header: "Margin", align: "right" as const, render: (r: typeof rows[number]) => { const m = marginPct(toPence(r.sell_price), toPence(r.cost_price)); return m === null ? "—" : `${m}%`; } }] : []),
          { key: "q", header: "On quotes", render: (r) => ((r.catalogue_items as unknown as unknown[] | null)?.length ? <StatusBadge label="Published" tone="green" /> : <StatusBadge label="Not published" tone="grey" />) },
        ]}
        empty={{ title: "No equipment yet", description: "Build a catalogue of the equipment you specify so quotations stay consistent and priced correctly.", action: canWrite ? { label: "Add equipment", href: "/dashboard/equipment/new" } : undefined }}
        pagination={{ page, size, total, hrefFor: pageHref("/dashboard/equipment", sp) }} />
    </>
  );
}
