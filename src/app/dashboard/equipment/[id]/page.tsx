import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getEquipment, listSupplierOptions } from "@/features/suppliers/queries";
import { publishEquipment, setEquipmentActive } from "@/features/suppliers/actions";
import { listVatRates } from "@/features/quotes/queries";
import { EQUIPMENT_CATEGORIES } from "@/features/suppliers/schema";
import { documentCategories, listEntityDocuments } from "@/features/documents/queries";
import { EntityHeader, DescriptionList, ActionLink } from "@/components/dashboard/entity";
import { Panel, Metric, StatusBadge } from "@/components/dashboard/primitives";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { RedirectingAction } from "@/components/dashboard/redirecting-action";
import { DocumentsPanel } from "@/components/dashboard/documents";
import { EquipmentForm } from "@/components/dashboard/forms/supplier-forms";
import { formatGBP, toPence, marginPct } from "@/lib/money";

export default async function EquipmentItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/equipment/${id}`);
  if (!ctx.can("projects.read")) redirect("/dashboard");
  const item = await getEquipment(ctx, id);
  if (!item) notFound();
  const [suppliers, vat, docs, categories] = await Promise.all([listSupplierOptions(ctx), listVatRates(ctx), listEntityDocuments(ctx, "supplier", id), documentCategories(ctx, "supplier")]);
  const canWrite = ctx.can("finance.write");
  const showCost = ctx.can("finance.read");
  const supplier = item.suppliers as unknown as { id: string; name: string } | null;
  const published = ((item.catalogue_items as unknown as { id: string; active: boolean }[] | null) ?? []).length > 0;
  const margin = marginPct(toPence(item.sell_price), toPence(item.cost_price));
  const path = `/dashboard/equipment/${id}`;
  return (
    <>
      <EntityHeader back={{ href: "/dashboard/equipment", label: "Equipment" }} eyebrow={EQUIPMENT_CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category} title={item.name}
        badge={item.active ? (published ? <StatusBadge label="On quotations" tone="green" /> : <StatusBadge label="Not published" tone="grey" />) : <StatusBadge label="Inactive" tone="grey" />}
        meta={<>{supplier ? <Link href={`/dashboard/suppliers/${supplier.id}`} className="underline">{supplier.name}</Link> : null}{item.supplier_sku ? <span>SKU {item.supplier_sku}</span> : null}</>}
        actions={canWrite ? <>
          <RedirectingAction action={publishEquipment.bind(null, id)} label={published ? "Refresh quote catalogue" : "Publish to quotations"} variant={published ? "outline" : "copper"} />
          {item.active
            ? <ConfirmAction action={setEquipmentActive.bind(null, id, false)} label="Deactivate" title="Deactivate this item?" description="It leaves the quotation picker. Existing quote lines keep their values." confirmLabel="Deactivate" />
            : <ConfirmAction action={setEquipmentActive.bind(null, id, true)} label="Reactivate" title="Reactivate this item?" variant="outline" confirmLabel="Reactivate" />}
        </> : null} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {showCost ? <Metric label="Cost price" value={formatGBP(toPence(item.cost_price))} /> : null}
        <Metric label="Standard sell" value={formatGBP(toPence(item.sell_price))} />
        {showCost ? <Metric label="Margin" value={margin === null ? "—" : `${margin}%`} tone={margin !== null && margin < 15 ? "warning" : "default"} /> : null}
        <Metric label="VAT rate" value={vat.find((v) => v.key === item.vat_rate_key)?.label ?? item.vat_rate_key} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {item.specification ? <Panel title="Specification"><p className="whitespace-pre-wrap text-sm leading-relaxed">{item.specification}</p></Panel> : null}
          {canWrite ? (
            <Panel title="Details"><div className="max-w-3xl"><EquipmentForm equipment={item} suppliers={suppliers} vatRates={vat.map((v) => ({ value: v.key, label: `${v.label} (${Number(v.rate)}%)` }))} /></div></Panel>
          ) : (
            <Panel title="Details"><DescriptionList cols={2} items={[{ label: "Description", value: item.description }, { label: "Supplier", value: supplier?.name }, { label: "SKU", value: item.supplier_sku }]} /></Panel>
          )}
        </div>
        <div className="space-y-6">
          <Panel title="Quotations">
            <p className="text-sm text-muted-light">{published
              ? "This item is in the quotation line picker with its current prices. Publish again after a price change to refresh it."
              : "Publish this item to make it selectable on quotation lines, with cost and sell prices filled in automatically."}</p>
            {published ? <p className="mt-3 text-sm"><ActionLink href="/dashboard/settings/catalogue" className="h-8 px-3 text-xs">Open the quote catalogue</ActionLink></p> : null}
          </Panel>
          <Panel title="Datasheets and images">
            <DocumentsPanel entityType="supplier" entityId={id} documents={docs} categories={categories} canWrite={canWrite} revalidate={path} />
          </Panel>
        </div>
      </div>
    </>
  );
}
