"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requirePermission } from "@/lib/auth/context";
import { parseForm, nullable, type FormState } from "@/lib/forms";
import { projectSchema, projectStatusSchema } from "./schema";
import { logger } from "@/lib/logger";

function dbError(error: { code?: string; message: string }, fallback: string): FormState {
  if (error.code === "42501") return { error: "You don’t have permission to do that." };
  logger.error("db.error", { code: error.code, message: error.message });
  return { error: fallback };
}

export async function saveProject(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireOrgContext();
  if (!id && !ctx.can("projects.write")) return { error: "You don’t have permission to create projects." };
  const p = parseForm(projectSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;
  const row = {
    name: d.name, description: nullable(d.description), status: d.status, client_id: d.client_id, site_id: nullable(d.site_id), lead_id: nullable(d.lead_id),
    project_manager_id: nullable(d.project_manager_id), start_date: nullable(d.start_date), end_date: nullable(d.end_date),
    contract_value: d.contract_value ?? "0.00", estimated_cost: d.estimated_cost ?? "0.00", service_keys: d.service_keys, notes: nullable(d.notes),
  };
  if (id) {
    const { error } = await ctx.supabase.from("projects").update(row).eq("id", id);
    if (error) return dbError(error, "Couldn’t update the project.");
    revalidatePath(`/dashboard/projects/${id}`);
    revalidatePath("/dashboard/projects");
    return { success: "Saved.", redirectTo: `/dashboard/projects/${id}` };
  }
  const { data, error } = await ctx.supabase.from("projects").insert({ ...row, project_number: "", organisation_id: ctx.organisation.id, created_by: ctx.user.id }).select("id").single();
  if (error || !data) return dbError(error ?? { message: "no row" }, "Couldn’t create the project.");
  revalidatePath("/dashboard/projects");
  return { success: "Created.", redirectTo: `/dashboard/projects/${data.id}` };
}

export async function setProjectStatus(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireOrgContext();
  const p = parseForm(projectStatusSchema, formData);
  if (!p.ok) return p.state;
  const { error } = await ctx.supabase.from("projects").update({ status: p.data.status }).eq("id", id);
  if (error) return dbError(error, "Couldn’t change the status.");
  revalidatePath(`/dashboard/projects/${id}`);
  revalidatePath("/dashboard/projects");
  return { success: "Status updated." };
}

export async function archiveProject(id: string) {
  const ctx = await requirePermission("projects.write");
  await ctx.supabase.from("projects").update({ archived_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/dashboard/projects");
  return { redirectTo: "/dashboard/projects" };
}
