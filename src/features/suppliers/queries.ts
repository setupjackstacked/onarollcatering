import "server-only";

import { cache } from "react";
import type { OrgContext } from "@/lib/auth/context";
import { pageParams, str } from "@/lib/pagination";
import type { SupplierCategory } from "@/lib/supabase/types";

export async function listSuppliers(ctx: OrgContext, sp: Record<string, string | string[] | undefined>) {
  const { from, to, page, size } = pageParams(sp);
  const q = str(sp.q), category = str(sp.category);
  let query = ctx.supabase.from("suppliers").select("id, name, category, email, phone, payment_terms_days, website", { count: "exact" })
    .eq("organisation_id", ctx.organisation.id).is("archived_at", null).order("name").range(from, to);
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,account_number.ilike.%${q}%`);
  if (category) query = query.eq("category", category as SupplierCategory);
  const { data, count } = await query;
  return { rows: data ?? [], total: count ?? 0, page, size };
}

export const listSupplierOptions = cache(async (ctx: OrgContext) => {
  const { data } = await ctx.supabase.from("suppliers").select("id, name").eq("organisation_id", ctx.organisation.id).is("archived_at", null).order("name").limit(500);
  return (data ?? []).map((s) => ({ value: s.id, label: s.name }));
});

export const getSupplier = cache(async (ctx: OrgContext, id: string) => {
  const { data } = await ctx.supabase.from("suppliers").select("*").eq("id", id).maybeSingle();
  return data;
});

export async function listSupplierContacts(ctx: OrgContext, supplierId: string) {
  const { data } = await ctx.supabase.from("supplier_contacts").select("*").eq("supplier_id", supplierId).is("archived_at", null).order("is_primary", { ascending: false }).order("first_name");
  return data ?? [];
}

export async function supplierSpend(ctx: OrgContext, supplierId: string) {
  const { data } = await ctx.supabase.rpc("supplier_spend", { p_supplier_id: supplierId });
  const rows = (data ?? []) as unknown as { committed: string; actual: string; expense_count: number }[];
  const row = rows[0];
  return { committed: row?.committed ?? "0", actual: row?.actual ?? "0", count: Number(row?.expense_count ?? 0) };
}

// ---------- equipment --------------------------------------------------------
export async function listEquipment(ctx: OrgContext, sp: Record<string, string | string[] | undefined>, filter?: { supplierId?: string }) {
  const { from, to, page, size } = pageParams(sp);
  const q = str(sp.q), category = str(sp.category), active = str(sp.active) || "true";
  let query = ctx.supabase.from("equipment").select("*, suppliers(id, name), catalogue_items(id)", { count: "exact" })
    .eq("organisation_id", ctx.organisation.id).order("category").order("name").range(from, to);
  if (q) query = query.or(`name.ilike.%${q}%,supplier_sku.ilike.%${q}%,specification.ilike.%${q}%`);
  if (category) query = query.eq("category", category);
  if (active !== "all") query = query.eq("active", active === "true");
  if (filter?.supplierId) query = query.eq("supplier_id", filter.supplierId);
  const { data, count } = await query;
  return { rows: data ?? [], total: count ?? 0, page, size };
}

export const getEquipment = cache(async (ctx: OrgContext, id: string) => {
  const { data } = await ctx.supabase.from("equipment").select("*, suppliers(id, name), catalogue_items(id, active)").eq("id", id).maybeSingle();
  return data;
});
