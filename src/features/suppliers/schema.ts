import { z } from "zod";
import { optionalText, requiredText, optionalUuid, optionalEmail, money } from "@/lib/forms/fields";

export const SUPPLIER_CATEGORIES = [
  { value: "food", label: "Food" }, { value: "equipment", label: "Equipment" }, { value: "fabrication", label: "Fabrication" }, { value: "extraction", label: "Extraction" },
  { value: "refrigeration", label: "Refrigeration" }, { value: "electrical", label: "Electrical" }, { value: "plumbing", label: "Plumbing" }, { value: "transport", label: "Transport" },
  { value: "agency_staff", label: "Agency staff" }, { value: "cleaning", label: "Cleaning" }, { value: "other", label: "Other" },
] as const;
export const supplierCategoryLabel = (k: string) => SUPPLIER_CATEGORIES.find((c) => c.value === k)?.label ?? k;

export const EQUIPMENT_CATEGORIES = [
  { value: "cooking", label: "Cooking" }, { value: "refrigeration", label: "Refrigeration" }, { value: "preparation", label: "Preparation" }, { value: "warewashing", label: "Warewashing" },
  { value: "extraction", label: "Extraction" }, { value: "storage", label: "Storage" }, { value: "servery", label: "Servery" }, { value: "modular", label: "Modular units" }, { value: "equipment", label: "Other equipment" },
];

export const supplierSchema = z.object({
  name: requiredText(2, 200, "Enter the company name"),
  category: z.enum(SUPPLIER_CATEGORIES.map((c) => c.value) as [string, ...string[]]),
  email: optionalEmail,
  phone: optionalText(40),
  website: optionalText(200),
  address_line1: optionalText(120),
  address_city: optionalText(80),
  address_postcode: optionalText(12),
  vat_number: optionalText(40),
  account_number: optionalText(60),
  payment_terms_days: z.coerce.number().int().min(0).max(180).default(30),
  notes: optionalText(4000),
});

export const supplierContactSchema = z.object({
  first_name: requiredText(1, 80, "Enter a first name"),
  last_name: optionalText(80),
  job_title: optionalText(80),
  email: optionalEmail,
  phone: optionalText(40),
  is_primary: z.string().optional(),
});

export const equipmentSchema = z.object({
  name: requiredText(2, 200, "Enter a name"),
  category: z.string().min(1).max(40),
  supplier_id: optionalUuid,
  supplier_sku: optionalText(80),
  description: optionalText(1000),
  specification: optionalText(4000),
  cost_price: money,
  sell_price: money,
  vat_rate_key: z.string().min(1).max(40),
  notes: optionalText(2000),
});
