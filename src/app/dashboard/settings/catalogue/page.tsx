import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { deactivateCatalogueItem, deactivateVatRate } from "@/features/quotes/catalogue-actions";
import { PageHeader, Panel } from "@/components/dashboard/primitives";
import { ActionLink } from "@/components/dashboard/entity";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { CatalogueItemForm, VatRateForm, CATEGORIES } from "@/components/dashboard/forms/catalogue-forms";
import { formatMoney, toPence } from "@/lib/money";
import { str } from "@/lib/pagination";

export const metadata = { title: "Catalogue & VAT" };

export default async function CataloguePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/settings/catalogue");
  if (!ctx.can("finance.read") && ctx.role !== "administrator") redirect("/dashboard/settings");
  const sp = await searchParams;
  const canWrite = ctx.can("finance.write");
  const editItem = str(sp.item), editVat = str(sp.vat), adding = str(sp.add);
  const [{ data: items }, { data: rates }] = await Promise.all([
    ctx.supabase.from("catalogue_items").select("id, name, category, description, unit, cost_price, sell_price, vat_rate_key").eq("organisation_id", ctx.organisation.id).eq("active", true).order("category").order("name"),
    ctx.supabase.from("vat_rates").select("id, key, label, rate, is_default").eq("organisation_id", ctx.organisation.id).eq("active", true).order("sort_order"),
  ]);
  const vatOptions = (rates ?? []).map((r) => ({ value: r.key, label: `${r.label} (${Number(r.rate)}%)` }));
  const itemToEdit = editItem ? (items ?? []).find((i) => i.id === editItem) : null;
  const vatToEdit = editVat ? (rates ?? []).find((r) => r.id === editVat) : null;
  const byCat = new Map<string, NonNullable<typeof items>>();
  for (const i of items ?? []) byCat.set(i.category, [...(byCat.get(i.category) ?? []), i]);

  return (
    <>
      <PageHeader eyebrow="Settings" title="Catalogue & VAT" description="Reusable price-list items for quotes, and the VAT rates available on lines." actions={canWrite ? <><ActionLink href="?add=item" variant="copper">Add item</ActionLink><ActionLink href="?add=vat">Add VAT rate</ActionLink></> : null} />
      {canWrite && (adding === "item" || itemToEdit) ? <Panel title={itemToEdit ? `Edit ${itemToEdit.name}` : "New catalogue item"} className="mb-6"><div className="max-w-3xl"><CatalogueItemForm item={itemToEdit} vatRates={vatOptions} /></div></Panel> : null}
      {canWrite && (adding === "vat" || vatToEdit) ? <Panel title={vatToEdit ? `Edit ${vatToEdit.label}` : "New VAT rate"} className="mb-6"><div className="max-w-3xl"><VatRateForm rate={vatToEdit} /></div></Panel> : null}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {byCat.size === 0 ? <Panel title="Catalogue"><p className="text-sm text-muted-light">No items yet. Items you add here appear in the quote line picker with cost and sell prices pre-filled.</p></Panel> : null}
          {[...byCat.entries()].map(([cat, list]) => (
            <Panel key={cat} title={CATEGORIES.find((c) => c.value === cat)?.label ?? cat}>
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-light"><tr><th className="py-2 pr-3 font-medium">Item</th><th className="py-2 pr-3 font-medium">Unit</th><th className="py-2 pr-3 text-right font-medium">Cost</th><th className="py-2 pr-3 text-right font-medium">Sell</th><th className="py-2 pr-3 font-medium">VAT</th>{canWrite ? <th className="py-2" /> : null}</tr></thead>
                <tbody className="divide-y divide-graphite/10">
                  {list.map((i) => (
                    <tr key={i.id}>
                      <td className="py-2 pr-3">{i.name}{i.description ? <span className="block text-xs text-muted-light">{i.description}</span> : null}</td>
                      <td className="py-2 pr-3">{i.unit}</td>
                      <td className="py-2 pr-3 text-right num-lining text-muted-light">{formatMoney(toPence(i.cost_price))}</td>
                      <td className="py-2 pr-3 text-right num-lining">{formatMoney(toPence(i.sell_price))}</td>
                      <td className="py-2 pr-3">{i.vat_rate_key}</td>
                      {canWrite ? <td className="py-2 text-right whitespace-nowrap"><ActionLink href={`?item=${i.id}`} className="h-8 px-3 text-xs">Edit</ActionLink> <ConfirmAction action={deactivateCatalogueItem.bind(null, i.id)} label="Remove" title={`Remove ${i.name} from the catalogue?`} description="Existing quote lines keep their values." confirmLabel="Remove" className="h-8 px-3 text-xs" /></td> : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          ))}
        </div>
        <Panel title="VAT rates">
          <ul className="divide-y divide-graphite/10 text-sm">
            {(rates ?? []).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                <span>{r.label} <span className="num-lining text-muted-light">· {Number(r.rate)}%</span>{r.is_default ? <span className="ml-2 rounded-full bg-copper/15 px-2 py-0.5 text-xs text-copper-dark">Default</span> : null}<span className="block text-xs text-muted-light">key: {r.key}</span></span>
                {canWrite ? <span className="flex gap-1"><ActionLink href={`?vat=${r.id}`} className="h-8 px-3 text-xs">Edit</ActionLink>{!r.is_default ? <ConfirmAction action={deactivateVatRate.bind(null, r.id)} label="Remove" title={`Remove ${r.label}?`} confirmLabel="Remove" className="h-8 px-3 text-xs" /> : null}</span> : null}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
