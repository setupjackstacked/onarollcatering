import { z } from "zod";
import { optionalText, requiredText, optionalUuid, money } from "@/lib/forms/fields";

export const QUOTE_CATEGORIES = [
  { value: "equipment", label: "Equipment" },
  { value: "labour", label: "Labour" },
  { value: "installation", label: "Installation" },
  { value: "catering", label: "Catering" },
  { value: "transport", label: "Transport" },
  { value: "materials", label: "Materials" },
  { value: "professional_services", label: "Professional Services" },
  { value: "other", label: "Other" },
] as const;

export const quoteHeaderSchema = z
  .object({
    title: requiredText(2, 200, "Give the quote a title"),
    client_id: z.string().uuid("Select a client"),
    contact_id: optionalUuid,
    project_id: optionalUuid,
    lead_id: optionalUuid,
    issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date"),
    expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date"),
    discount_pct: z.coerce.number().min(0).max(100).default(0),
    scope_notes: optionalText(10000),
    terms: optionalText(10000),
    internal_notes: optionalText(10000),
  })
  .refine((d) => d.expiry_date >= d.issue_date, { path: ["expiry_date"], message: "Expiry must be on or after the issue date" });

export const lineSchema = z.object({
  catalogue_item_id: z.string().uuid().optional().or(z.literal("")).nullable(),
  description: z.string().trim().min(1).max(500),
  category: z.string().max(40).default("other"),
  quantity: z.coerce.number().min(0).max(1_000_000),
  unit: z.string().trim().max(20).default("each"),
  cost_price: money.default("0.00"),
  sell_price: money.default("0.00"),
  discount_pct: z.coerce.number().min(0).max(100).default(0),
  vat_rate: z.coerce.number().min(0).max(100),
  internal_notes: z.string().max(1000).optional().nullable(),
});
export const linesSchema = z.array(lineSchema).max(200);
export type LineInputRow = z.input<typeof lineSchema>;

export const sendQuoteSchema = z.object({
  to: z.string().trim().email("Enter a valid email"),
  cc: z.string().trim().email().optional().or(z.literal("")),
  message: optionalText(4000),
});

export const decisionSchema = z.object({
  decision: z.enum(["accept", "decline"]),
  name: z.string().trim().min(2, "Enter your name").max(120),
  note: optionalText(2000),
  token: z.string().min(10).max(120),
});

export const DEFAULT_TERMS = `Prices exclude VAT unless stated. Validity as shown above. Payment terms as agreed in contract; unless otherwise stated, 30 days from invoice date.
Site access, utilities and welfare to be provided by the client unless included in the scope. Programme dates are indicative and subject to survey, site readiness and supplier lead times.`;
