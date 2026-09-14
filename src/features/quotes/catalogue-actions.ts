"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/context";
import { parseForm, nullable, type FormState } from "@/lib/forms";
import { optionalText, requiredText, money } from "@/lib/forms/fields";

const itemSchema = z.object({
  name: requiredText(1, 160, "Enter a name"),
  category: z.string().max(40).default("other"),
  description: optionalText(1000),
  unit: z.string().trim().min(1).max(20).default("each"),
  cost_price: money.default("0.00"),
  sell_price: money.default("0.00"),
  vat_rate_key: z.string().min(1).max(40),
});

const vatSchema = z.object({
  key: z.string().trim().regex(/^[a-z0-9_-]{1,30}$/, "Lowercase letters, numbers, - or _"),
  label: requiredText(1, 60, "Enter a label"),
  rate: z.coerce.number().min(0).max(100),
  is_default: z.coerce.boolean().default(false),
});

const PATH = "/dashboard/settings/catalogue";

export async function saveCatalogueItem(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const p = parseForm(itemSchema, formData);
  if (!p.ok) return p.state;
  const row = { ...p.data, description: nullable(p.data.description) };
  const r = id ? await ctx.supabase.from("catalogue_items").update(row).eq("id", id) : await ctx.supabase.from("catalogue_items").insert({ ...row, organisation_id: ctx.organisation.id });
  if (r.error) return { error: r.error.code === "42501" ? "You don’t have permission to do that." : "Couldn’t save the item." };
  revalidatePath(PATH);
  return { success: "Saved.", redirectTo: PATH };
}

export async function deactivateCatalogueItem(id: string) {
  const ctx = await requirePermission("finance.write");
  await ctx.supabase.from("catalogue_items").update({ active: false }).eq("id", id);
  revalidatePath(PATH);
}

export async function saveVatRate(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const p = parseForm(vatSchema, formData);
  if (!p.ok) return p.state;
  const row = { key: p.data.key, label: p.data.label, rate: p.data.rate.toFixed(2), is_default: p.data.is_default };
  if (row.is_default) await ctx.supabase.from("vat_rates").update({ is_default: false }).eq("organisation_id", ctx.organisation.id).eq("is_default", true);
  const r = id ? await ctx.supabase.from("vat_rates").update(row).eq("id", id) : await ctx.supabase.from("vat_rates").insert({ ...row, organisation_id: ctx.organisation.id, sort_order: 99 });
  if (r.error) return { error: r.error.code === "23505" ? "That key is already in use." : "Couldn’t save the VAT rate." };
  revalidatePath(PATH);
  return { success: "Saved.", redirectTo: PATH };
}

export async function deactivateVatRate(id: string) {
  const ctx = await requirePermission("finance.write");
  await ctx.supabase.from("vat_rates").update({ active: false, is_default: false }).eq("id", id);
  revalidatePath(PATH);
}
