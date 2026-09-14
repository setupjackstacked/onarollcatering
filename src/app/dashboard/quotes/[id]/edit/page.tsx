import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getQuote, listQuoteItems, listVatRates, listCatalogue } from "@/features/quotes/queries";
import { listClientOptions, listProjectOptions } from "@/features/shared/lookups";
import { listContacts } from "@/features/clients/queries";
import { EntityHeader } from "@/components/dashboard/entity";
import { Panel } from "@/components/dashboard/primitives";
import { QuoteHeaderForm, QuoteLines } from "@/components/dashboard/forms/quote-forms";
import { QuoteBadge } from "@/lib/domain/badges";

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/quotes/${id}/edit`);
  if (!ctx.can("sales.write")) redirect(`/dashboard/quotes/${id}`);
  const quote = await getQuote(ctx, id);
  if (!quote) notFound();
  if (quote.status !== "draft") redirect(`/dashboard/quotes/${id}`);
  const [items, vat, catalogue, clients, projects, contacts] = await Promise.all([listQuoteItems(ctx, id), listVatRates(ctx), listCatalogue(ctx), listClientOptions(ctx), listProjectOptions(ctx), listContacts(ctx, quote.client_id)]);
  return (
    <>
      <EntityHeader back={{ href: `/dashboard/quotes/${id}`, label: quote.quote_number }} eyebrow={`Editing ${quote.quote_number}${quote.revision ? ` · r${quote.revision}` : ""}`} title={quote.title} badge={<QuoteBadge status={quote.status} />} />
      <div className="space-y-6">
        <Panel title="Line items">
          <QuoteLines
            quoteId={id}
            initial={items.map((i) => ({ key: i.id, catalogue_item_id: i.catalogue_item_id, description: i.description, category: i.category, quantity: String(Number(i.quantity)), unit: i.unit, cost_price: i.cost_price, sell_price: i.sell_price, discount_pct: String(Number(i.discount_pct)), vat_rate: i.vat_rate, internal_notes: i.internal_notes ?? "" }))}
            vatRates={vat}
            catalogue={catalogue}
            discountPct={Number(quote.discount_pct)}
          />
        </Panel>
        <Panel title="Details">
          <div className="max-w-3xl"><QuoteHeaderForm quote={quote} clients={clients} projects={projects} contacts={contacts.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}`.trim() }))} /></div>
        </Panel>
      </div>
    </>
  );
}
