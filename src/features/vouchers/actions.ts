"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/auth/context";
import { parseForm, nullable, type FormState } from "@/lib/forms";
import { voucherCategorySchema } from "./schema";
import { logger } from "@/lib/logger";

/**
 * Saves a day's numbers. Quantities arrive as `qty:<categoryId>` fields so the
 * form works without JavaScript and adding a category needs no code change.
 */
export async function recordVouchers(siteId: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireOrgContext();
  const date = String(formData.get("entry_date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { fieldErrors: { entry_date: ["Enter a date"] } };

  const lines: { category_id: string; quantity: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("qty:")) continue;
    const categoryId = key.slice(4);
    const quantity = Number(String(value).trim() || "0");
    if (!Number.isFinite(quantity) || quantity < 0) return { error: "Quantities must be zero or more." };
    if (quantity > 0) lines.push({ category_id: categoryId, quantity: Math.round(quantity) });
  }
  if (!lines.length) return { error: "Enter at least one quantity." };

  const { error } = await ctx.supabase.rpc("record_vouchers", {
    p_site_id: siteId, p_date: date, p_lines: lines as never, p_notes: nullable(String(formData.get("notes") ?? "")),
  });
  if (error) {
    if (error.code === "42501") return { error: error.message.replace(/^[^:]*: /, "") };
    if (error.code === "23514" || error.message.includes("future date")) return { error: "You can’t log vouchers for a future date." };
    logger.error("vouchers.record_failed", { message: error.message });
    return { error: "Couldn’t save today’s numbers. Please try again." };
  }
  revalidatePath("/dashboard/vouchers");
  revalidatePath(`/dashboard/sites/${siteId}/vouchers`);
  revalidatePath("/staff/vouchers");
  const back = String(formData.get("return") ?? "");
  return { success: "Saved.", redirectTo: back.startsWith("/dashboard") || back.startsWith("/staff") ? back : undefined };
}

export async function confirmVouchers(entryId: string, siteId: string) {
  const ctx = await requireOrgContext();
  const { error } = await ctx.supabase.rpc("confirm_vouchers", { p_entry_id: entryId });
  if (error) return { error: error.message.replace(/^[^:]*: /, "") };
  revalidatePath("/dashboard/vouchers");
  revalidatePath(`/dashboard/sites/${siteId}/vouchers`);
}

export async function saveVoucherCategory(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireOrgContext();
  if (!ctx.can("org.manage")) return { error: "Only an administrator can change voucher categories." };
  const p = parseForm(voucherCategorySchema, formData);
  if (!p.ok) return p.state;
  const row = {
    key: p.data.key, label: p.data.label, description: nullable(p.data.description),
    is_chargeable: p.data.is_chargeable === "true", sort_order: p.data.sort_order,
  };
  const r = id
    ? await ctx.supabase.from("voucher_categories").update(row).eq("id", id)
    : await ctx.supabase.from("voucher_categories").insert({ ...row, organisation_id: ctx.organisation.id });
  if (r.error) return { error: r.error.code === "23505" ? "That key is already in use." : "Couldn’t save the category." };
  revalidatePath("/dashboard/settings/vouchers");
  revalidatePath("/staff/vouchers");
  return { success: "Saved.", redirectTo: "/dashboard/settings/vouchers" };
}

export async function setVoucherCategoryActive(id: string, active: boolean) {
  const ctx = await requireOrgContext();
  if (!ctx.can("org.manage")) return { error: "Only an administrator can change voucher categories." };
  await ctx.supabase.from("voucher_categories").update({ active }).eq("id", id);
  revalidatePath("/dashboard/settings/vouchers");
}
