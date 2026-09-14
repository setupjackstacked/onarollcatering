"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/context";
import { parseForm, nullable, type FormState } from "@/lib/forms";
import { supplierSchema, supplierContactSchema, equipmentSchema } from "./schema";
import { logger } from "@/lib/logger";

function dbError(error: { code?: string; message: string }, fallback: string): FormState {
  if (error.code === "42501") return { error: "You don’t have permission to do that." };
  if (error.code === "23505") return { error: "A supplier with that name already exists." };
  logger.error("db.error", { code: error.code, message: error.message });
  return { error: fallback };
}

export async function saveSupplier(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const p = parseForm(supplierSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;
  const row = {
    name: d.name, category: d.category as never, email: nullable(d.email), phone: nullable(d.phone), website: nullable(d.website),
    address: { line1: d.address_line1 || null, city: d.address_city || null, postcode: d.address_postcode || null },
    vat_number: nullable(d.vat_number), account_number: nullable(d.account_number), payment_terms_days: d.payment_terms_days, notes: nullable(d.notes),
  };
  if (id) {
    const { error } = await ctx.supabase.from("suppliers").update(row).eq("id", id);
    if (error) return dbError(error, "Couldn’t save the supplier.");
    revalidatePath(`/dashboard/suppliers/${id}`);
    return { success: "Saved.", redirectTo: `/dashboard/suppliers/${id}` };
  }
  const { data, error } = await ctx.supabase.from("suppliers").insert({ ...row, organisation_id: ctx.organisation.id, created_by: ctx.user.id }).select("id").single();
  if (error || !data) return dbError(error ?? { message: "no row" }, "Couldn’t add the supplier.");
  revalidatePath("/dashboard/suppliers");
  return { success: "Added.", redirectTo: `/dashboard/suppliers/${data.id}` };
}

export async function archiveSupplier(id: string) {
  const ctx = await requirePermission("finance.write");
  await ctx.supabase.from("suppliers").update({ archived_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/dashboard/suppliers");
  return { redirectTo: "/dashboard/suppliers" };
}

export async function saveSupplierContact(supplierId: string, contactId: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const p = parseForm(supplierContactSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;
  const row = { first_name: d.first_name, last_name: d.last_name || "", job_title: nullable(d.job_title), email: nullable(d.email), phone: nullable(d.phone), is_primary: d.is_primary === "true" };
  if (row.is_primary) await ctx.supabase.from("supplier_contacts").update({ is_primary: false }).eq("supplier_id", supplierId);
  const r = contactId
    ? await ctx.supabase.from("supplier_contacts").update(row).eq("id", contactId)
    : await ctx.supabase.from("supplier_contacts").insert({ ...row, organisation_id: ctx.organisation.id, supplier_id: supplierId });
  if (r.error) return dbError(r.error, "Couldn’t save the contact.");
  revalidatePath(`/dashboard/suppliers/${supplierId}`);
  return { success: "Saved." };
}

export async function archiveSupplierContact(id: string, supplierId: string) {
  const ctx = await requirePermission("finance.write");
  await ctx.supabase.from("supplier_contacts").update({ archived_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(`/dashboard/suppliers/${supplierId}`);
}

// ---------- equipment --------------------------------------------------------
export async function saveEquipment(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const p = parseForm(equipmentSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;
  const row = { name: d.name, category: d.category, supplier_id: nullable(d.supplier_id), supplier_sku: nullable(d.supplier_sku), description: nullable(d.description), specification: nullable(d.specification), cost_price: d.cost_price, sell_price: d.sell_price, vat_rate_key: d.vat_rate_key, notes: nullable(d.notes) };
  if (id) {
    const { error } = await ctx.supabase.from("equipment").update(row).eq("id", id);
    if (error) return dbError(error, "Couldn’t save the equipment.");
    revalidatePath(`/dashboard/equipment/${id}`);
    return { success: "Saved.", redirectTo: `/dashboard/equipment/${id}` };
  }
  const { data, error } = await ctx.supabase.from("equipment").insert({ ...row, organisation_id: ctx.organisation.id, created_by: ctx.user.id }).select("id").single();
  if (error || !data) return dbError(error ?? { message: "no row" }, "Couldn’t add the equipment.");
  revalidatePath("/dashboard/equipment");
  return { success: "Added.", redirectTo: `/dashboard/equipment/${data.id}` };
}

/** Makes the item selectable on quotation lines with its current prices. */
export async function publishEquipment(id: string) {
  const ctx = await requirePermission("finance.write");
  const { error } = await ctx.supabase.rpc("publish_equipment_to_catalogue", { p_equipment_id: id });
  if (error) return { error: error.message.replace(/^[^:]*: /, "") };
  revalidatePath(`/dashboard/equipment/${id}`); revalidatePath("/dashboard/settings/catalogue");
}

export async function setEquipmentActive(id: string, active: boolean) {
  const ctx = await requirePermission("finance.write");
  await ctx.supabase.from("equipment").update({ active }).eq("id", id);
  revalidatePath(`/dashboard/equipment/${id}`); revalidatePath("/dashboard/equipment");
}
