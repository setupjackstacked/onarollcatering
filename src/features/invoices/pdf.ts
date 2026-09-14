import "server-only";

import { renderDocumentPdf, type PdfDoc } from "@/lib/pdf/document-pdf";
import { site } from "@/content/site";
import { DEFAULT_INVOICE_TERMS, PAYMENT_DETAILS } from "./schema";
import type { Tables } from "@/lib/supabase/types";
import type { Address } from "@/lib/domain/address";

type InvoiceRow = Tables<"invoices"> & { clients: { name: string; billing_address: unknown } | null; client_contacts: { first_name: string; last_name: string } | null; projects: { name: string; project_number: string } | null };

export async function invoicePdfBuffer(inv: InvoiceRow, items: Tables<"invoice_items">[]) {
  const isCredit = inv.kind === "credit_note";
  const d: PdfDoc = {
    kind: isCredit ? "credit_note" : "invoice",
    number: inv.invoice_number || "DRAFT",
    title: inv.title,
    status: inv.status,
    issueDate: inv.issue_date ?? new Date().toISOString().slice(0, 10),
    secondaryDateLabel: isCredit ? "Credit against" : "Due date",
    secondaryDate: isCredit ? null : inv.due_date,
    reference: inv.reference,
    client: { name: inv.clients?.name ?? "", address: (inv.clients?.billing_address as Partial<Address>) ?? null, contact: inv.client_contacts ? `${inv.client_contacts.first_name} ${inv.client_contacts.last_name}`.trim() : null },
    project: inv.projects ? `${inv.projects.project_number} · ${inv.projects.name}` : null,
    lines: items.map((i) => ({ description: i.description, quantity: i.quantity, unit: i.unit, sell_price: i.sell_price, discount_pct: i.discount_pct, vat_rate: i.vat_rate, line_net: i.line_net })),
    subtotal: inv.subtotal, discountAmount: inv.discount_amount, vatAmount: inv.vat_amount, total: inv.total, amountPaid: isCredit ? undefined : inv.amount_paid,
    scopeNotes: inv.notes, terms: inv.terms ?? DEFAULT_INVOICE_TERMS, paymentDetails: isCredit ? null : PAYMENT_DETAILS,
    logoUrl: `${site.url}/brand/logo-copper.png`,
  };
  return renderDocumentPdf(d);
}
