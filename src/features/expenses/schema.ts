import { z } from "zod";
import { optionalText, requiredText, optionalUuid, money } from "@/lib/forms/fields";

export const COST_CATEGORIES = [
  { value: "labour", label: "Labour" }, { value: "food", label: "Food" }, { value: "equipment", label: "Equipment" }, { value: "materials", label: "Materials" }, { value: "transport", label: "Transport" },
  { value: "accommodation", label: "Accommodation" }, { value: "subcontractors", label: "Subcontractors" }, { value: "hire", label: "Hire" }, { value: "utilities", label: "Utilities" }, { value: "other", label: "Other" },
] as const;
export type CostCategory = (typeof COST_CATEGORIES)[number]["value"];
export const categoryLabel = (k: string) => COST_CATEGORIES.find((c) => c.value === k)?.label ?? k;

export const EXPENSE_STATUSES = [
  { value: "pending", label: "Pending approval" }, { value: "committed", label: "Committed (PO / agreed)" }, { value: "actual", label: "Actual (incurred)" }, { value: "paid", label: "Paid" }, { value: "rejected", label: "Rejected" },
] as const;

export const expenseSchema = z.object({
  project_id: optionalUuid,
  supplier_id: optionalUuid,
  supplier_name: optionalText(160),
  category: z.enum(COST_CATEGORIES.map((c) => c.value) as [CostCategory, ...CostCategory[]]),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date"),
  description: requiredText(1, 500, "Describe the cost"),
  net: money,
  vat: money,
  reference: optionalText(120),
  status: z.enum(["pending", "committed", "actual", "paid", "rejected"]).default("pending"),
  notes: optionalText(4000),
});

export const estimateSchema = z.object({
  category: z.enum(COST_CATEGORIES.map((c) => c.value) as [CostCategory, ...CostCategory[]]),
  amount: money,
  notes: optionalText(500),
});
