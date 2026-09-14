import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getInvoice, listInvoiceItems } from "@/features/invoices/queries";
import { listVatRates, listCatalogue } from "@/features/quotes/queries";
import { listClientOptions, listProjectOptions } from "@/features/shared/lookups";
import { listContacts } from "@/features/clients/queries";
import { EntityHeader } from "@/components/dashboard/entity";
import { Panel } from "@/components/dashboard/primitives";
import { InvoiceHeaderForm, InvoiceLines } from "@/components/dashboard/forms/invoice-forms";
import { InvoiceBadge } from "@/lib/domain/badges";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/invoices/${id}/edit`);
  if (!ctx.can("finance.write")) redirect(`/dashboard/invoices/${id}`);
  const inv = await getInvoice(ctx, id);
  if (!inv) notFound();
  const draft = inv.status === "draft";
  const [items, vat, catalogue, clients, projects, contacts] = await Promise.all([listInvoiceItems(ctx, id), listVatRates(ctx), listCatalogue(ctx), listClientOptions(ctx), listProjectOptions(ctx), listContacts(ctx, inv.client_id)]);
  return (
    <>
      <EntityHeader back={{ href: `/dashboard/invoices/${id}`, label: inv.invoice_number || "Draft invoice" }} eyebrow={`Editing ${inv.invoice_number || "draft"}`} title={inv.title} badge={<InvoiceBadge status={inv.status} />} />
      <div className="space-y-6">
        {draft ? (
          <Panel title="Line items">
            <InvoiceLines invoiceId={id} vatRates={vat} catalogue={catalogue} discountPct={Number(inv.discount_pct)}
              initial={items.map((i) => ({ key: i.id, catalogue_item_id: null, description: i.description, category: i.category, quantity: String(Number(i.quantity)), unit: i.unit, cost_price: "0.00", sell_price: i.sell_price, discount_pct: String(Number(i.discount_pct)), vat_rate: i.vat_rate, internal_notes: "" }))} />
          </Panel>
        ) : null}
        <Panel title="Details">
          <div className="max-w-3xl"><InvoiceHeaderForm invoice={inv} clients={clients} projects={projects} contacts={contacts.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}`.trim() }))} /></div>
        </Panel>
      </div>
    </>
  );
}
