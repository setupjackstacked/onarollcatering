"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requirePermission } from "@/lib/auth/context";
import { parseForm, nullable, type FormState } from "@/lib/forms";
import { clientSchema, contactSchema, siteSchema, toAddress } from "./schema";
import { logActivity } from "@/features/shared/activity";
import { logger } from "@/lib/logger";

function dbError(error: { code?: string; message: string }, fallback: string): FormState {
  if (error.code === "42501") return { error: "You don’t have permission to do that." };
  if (error.code === "23505") return { error: "That record already exists." };
  logger.error("db.error", { code: error.code, message: error.message });
  return { error: fallback };
}

export async function saveClient(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("sales.write");
  const p = parseForm(clientSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;
  const billing = toAddress("billing", d);
  const trading = d.trading_same ? billing : toAddress("trading", d);
  const row = {
    name: d.name,
    legal_name: nullable(d.legal_name),
    company_number: nullable(d.company_number),
    vat_number: nullable(d.vat_number),
    email: nullable(d.email),
    phone: nullable(d.phone),
    website: nullable(d.website),
    payment_terms_days: d.payment_terms_days,
    owner_user_id: nullable(d.owner_user_id),
    notes: nullable(d.notes),
    billing_address: billing,
    trading_address: trading,
  };
  if (id) {
    const { error } = await ctx.supabase.from("clients").update(row).eq("id", id);
    if (error) return dbError(error, "Couldn’t update the client.");
    await logActivity(ctx, "client", id, "client.updated");
    revalidatePath(`/dashboard/clients/${id}`);
    return { success: "Saved.", redirectTo: `/dashboard/clients/${id}` };
  }
  const { data, error } = await ctx.supabase.from("clients").insert({ ...row, organisation_id: ctx.organisation.id, created_by: ctx.user.id }).select("id").single();
  if (error || !data) return dbError(error ?? { message: "no row" }, "Couldn’t create the client.");
  await logActivity(ctx, "client", data.id, "client.created");
  revalidatePath("/dashboard/clients");
  return { success: "Created.", redirectTo: `/dashboard/clients/${data.id}` };
}

export async function archiveClient(id: string, restore = false) {
  const ctx = await requirePermission("sales.write");
  await ctx.supabase.from("clients").update({ archived_at: restore ? null : new Date().toISOString() }).eq("id", id);
  await logActivity(ctx, "client", id, restore ? "client.restored" : "client.archived");
  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
}

export async function saveContact(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("sales.write");
  const p = parseForm(contactSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;
  const row = {
    first_name: d.first_name, last_name: d.last_name?.trim() ?? "", job_title: nullable(d.job_title), email: nullable(d.email),
    mobile: nullable(d.mobile), phone: nullable(d.phone), is_primary: !!d.is_primary, is_finance: !!d.is_finance, is_project: !!d.is_project, notes: nullable(d.notes),
  };
  if (row.is_primary) {
    // one primary per client — demote others first
    await ctx.supabase.from("client_contacts").update({ is_primary: false }).eq("client_id", d.client_id).neq("id", id ?? "00000000-0000-0000-0000-000000000000");
  }
  const res = id
    ? await ctx.supabase.from("client_contacts").update(row).eq("id", id)
    : await ctx.supabase.from("client_contacts").insert({ ...row, client_id: d.client_id, organisation_id: ctx.organisation.id });
  if (res.error) return dbError(res.error, "Couldn’t save the contact.");
  if (!id) await logActivity(ctx, "client", d.client_id, "contact.added", { name: `${d.first_name} ${d.last_name ?? ""}`.trim() });
  revalidatePath(`/dashboard/clients/${d.client_id}/contacts`);
  return { success: "Saved.", redirectTo: `/dashboard/clients/${d.client_id}/contacts` };
}

export async function archiveContact(id: string, clientId: string) {
  const ctx = await requirePermission("sales.write");
  await ctx.supabase.from("client_contacts").update({ archived_at: new Date().toISOString(), is_primary: false }).eq("id", id);
  revalidatePath(`/dashboard/clients/${clientId}/contacts`);
}

export async function saveSite(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireOrgContext();
  if (!ctx.can("sales.write") && !ctx.can("projects.write")) return { error: "You don’t have permission to do that." };
  const p = parseForm(siteSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;
  const row = {
    name: d.name,
    address: { line1: d.line1 ?? "", line2: d.line2 ?? "", city: d.city ?? "", county: d.county ?? "", postcode: d.postcode ?? "", country: "GB" },
    postcode: nullable(d.postcode),
    site_contact_id: nullable(d.site_contact_id),
    access_details: nullable(d.access_details),
    notes: nullable(d.notes),
  };
  const res = id
    ? await ctx.supabase.from("sites").update(row).eq("id", id)
    : await ctx.supabase.from("sites").insert({ ...row, client_id: d.client_id, organisation_id: ctx.organisation.id });
  if (res.error) return dbError(res.error, "Couldn’t save the site.");
  if (!id) await logActivity(ctx, "client", d.client_id, "site.added", { name: d.name });
  revalidatePath(`/dashboard/clients/${d.client_id}/sites`);
  revalidatePath("/dashboard/sites");
  return { success: "Saved.", redirectTo: `/dashboard/clients/${d.client_id}/sites` };
}

export async function archiveSite(id: string, clientId: string) {
  const ctx = await requireOrgContext();
  await ctx.supabase.from("sites").update({ archived_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(`/dashboard/clients/${clientId}/sites`);
  revalidatePath("/dashboard/sites");
}
