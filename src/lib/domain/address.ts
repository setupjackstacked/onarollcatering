import { z } from "zod";

/** Postal address stored as JSONB on clients / sites. */
export const addressSchema = z.object({
  line1: z.string().trim().max(200).optional().or(z.literal("")),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  county: z.string().trim().max(120).optional().or(z.literal("")),
  postcode: z.string().trim().max(16).optional().or(z.literal("")),
  country: z.string().trim().length(2).default("GB"),
});
export type Address = z.infer<typeof addressSchema>;

export function formatAddress(a: Partial<Address> | null | undefined, separator = ", ") {
  if (!a) return "";
  return [a.line1, a.line2, a.city, a.county, a.postcode].filter((p) => p && p.trim()).join(separator);
}
