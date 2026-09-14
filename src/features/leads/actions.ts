"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requirePermission } from "@/lib/auth/context";
import { parseForm, nullable, type FormState } from "@/lib/forms";
import { leadSchema, leadStatusSchema, convertLeadSchema } from "./schema";
import { logger } from "@/lib/logger";

function dbError(error: { code?: string; message: string }, fallback: string): FormState {
  if (error.code === "42501") return { error: "You don’t have permission to do that." };
  logger.error("db.error", { code: error.code, message: error.message });
  return { error: fallback };
}

export async function saveLead(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("sales.write");
  const p = parseForm(leadSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;
  const row = {
    title: d.title, status: d.status, client_id: nullable(d.client_id), contact_id: nullable(d.contact_id),
    company_name: nullable(d.company_name), contact_name: nullable(d.contact_name), contact_email: nullable(d.contact_email), contact_phone: nullable(d.contact_phone),
    source_key: d.source_key, service_keys: d.service_keys, estimated_value: d.estimated_value ?? null, project_location: nullable(d.project_location),
    expected_start_date: nullable(d.expected_start_date), assigned_user_id: nullable(d.assigned_user_id), notes: nullable(d.notes), lost_reason: nullable(d.lost_reason),
  };
  if (id) {
    const { error } = await ctx.supabase.from("leads").update(row).eq("id", id);
    if (error) return dbError(error, "Couldn’t update the lead.");
    revalidatePath(`/dashboard/leads/${id}`);
    revalidatePath("/dashboard/leads");
    return { success: "Saved.", redirectTo: `/dashboard/leads/${id}` };
  }
  const { data, error } = await ctx.supabase.from("leads").insert({ ...row, organisation_id: ctx.organisation.id, created_by: ctx.user.id }).select("id").single();
  if (error || !data) return dbError(error ?? { message: "no row" }, "Couldn’t create the lead.");
  revalidatePath("/dashboard/leads");
  return { success: "Created.", redirectTo: `/dashboard/leads/${data.id}` };
}

/** Stage movement — allowed for sales_write and for the assigned user (RLS enforces). */
export async function setLeadStatus(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireOrgContext();
  const p = parseForm(leadStatusSchema, formData);
  if (!p.ok) return p.state;
  const { error } = await ctx.supabase.from("leads").update({ status: p.data.status, lost_reason: p.data.status === "lost" ? nullable(p.data.lost_reason) : null }).eq("id", id);
  if (error) return dbError(error, "Couldn’t change the status.");
  revalidatePath(`/dashboard/leads/${id}`);
  revalidatePath("/dashboard/leads");
  return { success: "Status updated." };
}

export async function moveLead(id: string, status: string) {
  const ctx = await requireOrgContext();
  await ctx.supabase.from("leads").update({ status: status as never }).eq("id", id);
  revalidatePath("/dashboard/leads");
}

export async function archiveLead(id: string) {
  const ctx = await requirePermission("sales.write");
  await ctx.supabase.from("leads").update({ archived_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/dashboard/leads");
  return { redirectTo: "/dashboard/leads" };
}

export async function convertLead(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("projects.write");
  const p = parseForm(convertLeadSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;
  const { data, error } = await ctx.supabase.rpc("convert_lead_to_project", {
    p_lead_id: id,
    p_name: d.name,
    p_site_id: nullable(d.site_id) ?? undefined,
    p_project_manager: nullable(d.project_manager_id) ?? undefined,
    p_contract_value: d.contract_value ? Number(d.contract_value) : undefined,
    p_start_date: nullable(d.start_date) ?? undefined,
  });
  if (error) {
    if (error.code === "23502") return { error: "Link a client to this lead before converting it." };
    return dbError(error, "Couldn’t convert the lead.");
  }
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/projects");
  return { success: "Converted.", redirectTo: `/dashboard/projects/${data}` };
}
