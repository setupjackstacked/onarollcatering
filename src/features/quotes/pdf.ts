import "server-only";

import { renderDocumentPdf, type PdfDoc } from "@/lib/pdf/document-pdf";
import { site } from "@/content/site";
import { DEFAULT_TERMS } from "./schema";
import type { Tables } from "@/lib/supabase/types";
import type { Address } from "@/lib/domain/address";

type QuoteRow = Tables<"quotes"> & { clients: { name: string; billing_address: unknown } | null; client_contacts: { first_name: string; last_name: string } | null; projects: { name: string; project_number: string } | null };

/** Builds the customer-facing PDF. Strips every cost field. */
export async function quotePdfBuffer(quote: QuoteRow, items: Tables<"quote_items">[]) {
  const d: PdfDoc = {
    kind: "quotation",
    number: quote.quote_number,
    revision: quote.revision,
    title: quote.title,
    issueDate: quote.issue_date,
    secondaryDateLabel: "Valid until",
    secondaryDate: quote.expiry_date,
    client: { name: quote.clients?.name ?? "", address: (quote.clients?.billing_address as Partial<Address>) ?? null, contact: quote.client_contacts ? `${quote.client_contacts.first_name} ${quote.client_contacts.last_name}`.trim() : null },
    project: quote.projects ? `${quote.projects.project_number} · ${quote.projects.name}` : null,
    lines: items.map((i) => ({ description: i.description, quantity: i.quantity, unit: i.unit, sell_price: i.sell_price, discount_pct: i.discount_pct, vat_rate: i.vat_rate, line_net: i.line_net })),
    subtotal: quote.subtotal, discountAmount: quote.discount_amount, vatAmount: quote.vat_amount, total: quote.total,
    scopeNotes: quote.scope_notes, terms: quote.terms ?? DEFAULT_TERMS,
    logoUrl: `${site.url}/brand/logo-copper.png`,
  };
  return renderDocumentPdf(d);
}
