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
