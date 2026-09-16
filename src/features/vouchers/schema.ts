import { z } from "zod";
import { optionalText, requiredText } from "@/lib/forms/fields";

export const voucherCategorySchema = z.object({
  key: z.string().trim().regex(/^[a-z0-9-]{2,40}$/, "Lowercase letters, numbers and hyphens"),
  label: requiredText(2, 80, "Name the category"),
  description: optionalText(300),
  is_chargeable: z.string().optional(),
  sort_order: z.coerce.number().int().min(0).max(999).default(50),
});

export const voucherEntrySchema = z.object({
  site_id: z.string().uuid("Select a site"),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date"),
  notes: optionalText(1000),
});

export type VoucherLineInput = { category_id: string; quantity: number };

export const GRAINS = [
  { value: "day", label: "By day" }, { value: "week", label: "By week" }, { value: "month", label: "By month" },
];
