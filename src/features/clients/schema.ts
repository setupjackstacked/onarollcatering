import { z } from "zod";
import { optionalText, requiredText, optionalEmail, optionalUuid, optionalDate, checkbox } from "@/lib/forms/fields";
import { addressSchema } from "@/lib/domain/address";

export const clientSchema = z.object({
  name: requiredText(2, 160, "Enter the company name"),
  legal_name: optionalText(200),
  company_number: optionalText(20),
  vat_number: optionalText(20),
  email: optionalEmail,
  phone: optionalText(40),
  website: optionalText(200),
  payment_terms_days: z.coerce.number().int().min(0).max(365).default(30),
  owner_user_id: optionalUuid,
  notes: optionalText(5000),
  billing_line1: optionalText(200),
  billing_line2: optionalText(200),
  billing_city: optionalText(120),
  billing_county: optionalText(120),
  billing_postcode: optionalText(16),
  trading_same: checkbox.optional(),
  trading_line1: optionalText(200),
  trading_line2: optionalText(200),
  trading_city: optionalText(120),
  trading_county: optionalText(120),
  trading_postcode: optionalText(16),
});
export type ClientInput = z.output<typeof clientSchema>;

export function toAddress(prefix: "billing" | "trading", d: ClientInput) {
  return addressSchema.parse({
    line1: d[`${prefix}_line1`], line2: d[`${prefix}_line2`], city: d[`${prefix}_city`], county: d[`${prefix}_county`], postcode: d[`${prefix}_postcode`], country: "IE",
  });
}

export const contactSchema = z.object({
  client_id: z.string().uuid(),
  first_name: requiredText(1, 80, "Enter a first name"),
  last_name: optionalText(80),
  job_title: optionalText(120),
  email: optionalEmail,
  mobile: optionalText(40),
  phone: optionalText(40),
  is_primary: checkbox.optional(),
  is_finance: checkbox.optional(),
  is_project: checkbox.optional(),
  notes: optionalText(2000),
});

export const SITE_TYPES = [
  { value: "kitchen", label: "Kitchen / catering site" }, { value: "project_site", label: "Project site" },
  { value: "office", label: "Office" }, { value: "other", label: "Other" },
];
export const SITE_STATUSES = [
  { value: "prospective", label: "Prospective" }, { value: "mobilising", label: "Mobilising" },
  { value: "operating", label: "Operating" }, { value: "paused", label: "Paused" }, { value: "closed", label: "Closed" },
];

export const siteSchema = z.object({
  client_id: z.string().uuid(),
  name: requiredText(2, 160, "Enter a site name"),
  site_type: z.enum(["kitchen", "project_site", "office", "other"]).default("kitchen"),
  status: z.enum(["prospective", "mobilising", "operating", "paused", "closed"]).default("operating"),
  oar_manager_id: optionalUuid,
  site_manager_name: optionalText(160),
  site_manager_email: optionalEmail,
  site_manager_phone: optionalText(40),
  opened_on: optionalDate,
  line1: optionalText(200),
  line2: optionalText(200),
  city: optionalText(120),
  county: optionalText(120),
  postcode: optionalText(16),
  site_contact_id: optionalUuid,
  access_details: optionalText(3000),
  notes: optionalText(3000),
});
