import { z } from "zod";
import { optionalText, requiredText, optionalUuid, optionalDate, money } from "@/lib/forms/fields";

export const invoiceHeaderSchema = z.object({
  title: requiredText(2, 200, "Give the invoice a title"),
  kind: z.enum(["standard", "deposit", "milestone", "final", "credit_note"]).default("standard"),
  client_id: z.string().uuid("Select a client"),
  contact_id: optionalUuid,
  project_id: optionalUuid,
  reference: optionalText(80),
  discount_pct: z.coerce.number().min(0).max(100).default(0),
  notes: optionalText(10000),
  terms: optionalText(10000),
  internal_notes: optionalText(10000),
});

export const invoiceLineSchema = z.object({
  description: z.string().trim().min(1).max(500),
  category: z.string().max(40).default("other"),
  quantity: z.coerce.number().min(0).max(1_000_000),
  unit: z.string().trim().max(20).default("each"),
  sell_price: money.default("0.00"),
  discount_pct: z.coerce.number().min(0).max(100).default(0),
  vat_rate: z.coerce.number().min(0).max(100),
});
export const invoiceLinesSchema = z.array(invoiceLineSchema).max(200);

export const issueSchema = z.object({
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date"),
  due_date: optionalDate,
});

export const paymentSchema = z.object({
  paid_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date"),
  amount: money.refine((v) => Number(v) > 0, "Enter an amount"),
  method: z.enum(["bank_transfer", "card", "cash", "cheque", "other"]),
  reference: optionalText(120),
  notes: optionalText(1000),
});

export const sendInvoiceSchema = z.object({
  to: z.string().trim().email("Enter a valid email"),
  message: optionalText(4000),
});

export const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank transfer" }, { value: "card", label: "Card" }, { value: "cash", label: "Cash" }, { value: "cheque", label: "Cheque" }, { value: "other", label: "Other" },
];

export const DEFAULT_INVOICE_TERMS = `Payment by bank transfer to the account shown. Please quote the invoice number as the payment reference. Interest may be charged on overdue balances in line with the Late Payment of Commercial Debts (Interest) Act 1998.`;
/** PLACEHOLDER — client to supply bank details; keep out of the repo if sensitive (use env). */
export const PAYMENT_DETAILS = process.env.INVOICE_PAYMENT_DETAILS ?? "Bank details to be supplied — set INVOICE_PAYMENT_DETAILS.";

/**
 * The client's approval chain. Separate from `status`, which tracks the money —
 * an invoice can be "with procurement" and unpaid at the same time.
 */
export const INVOICE_STAGES = [
  { value: "draft", label: "Draft", hint: "Not issued yet" },
  { value: "sent_to_site", label: "Sent to site", hint: "With the site for sign-off" },
  { value: "site_approved", label: "Site approved", hint: "Signed estimate received" },
  { value: "with_procurement", label: "With procurement", hint: "Client procurement reviewing" },
  { value: "procurement_approved", label: "Procurement approved", hint: "Budget agreed" },
  { value: "payment_certificate", label: "Payment certificate", hint: "Certificate issued" },
  { value: "ready_for_finance", label: "Ready for finance", hint: "Pack assembled" },
  { value: "with_finance", label: "With finance", hint: "Submitted to client accounts" },
  { value: "awaiting_payment", label: "Awaiting payment", hint: "Approved for payment" },
  { value: "paid", label: "Paid", hint: "Money received" },
  { value: "closed", label: "Closed", hint: "Case complete" },
  { value: "query", label: "Query", hint: "Client has raised a question" },
  { value: "on_hold", label: "On hold", hint: "Paused" },
  { value: "rejected", label: "Rejected", hint: "Client will not pay as submitted" },
] as const;

export const stageLabel = (k: string) => INVOICE_STAGES.find((s) => s.value === k)?.label ?? k;

/** The normal forward path, used to suggest the obvious next action. */
export const STAGE_PATH = [
  "sent_to_site", "site_approved", "with_procurement", "procurement_approved",
  "payment_certificate", "ready_for_finance", "with_finance", "awaiting_payment", "paid", "closed",
] as const;

export function nextStage(current: string) {
  const i = (STAGE_PATH as readonly string[]).indexOf(current);
  return i === -1 || i === STAGE_PATH.length - 1 ? null : STAGE_PATH[i + 1];
}

/** What to call the button that moves an invoice to a given stage. */
export const STAGE_ACTION: Record<string, string> = {
  sent_to_site: "Send to site",
  site_approved: "Mark site approved",
  with_procurement: "Send to procurement",
  procurement_approved: "Mark procurement approved",
  payment_certificate: "Payment certificate received",
  ready_for_finance: "Ready for finance",
  with_finance: "Submitted to finance",
  awaiting_payment: "Awaiting payment",
  paid: "Mark paid",
  closed: "Close case",
};
