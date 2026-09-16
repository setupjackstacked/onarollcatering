"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrgContext } from "@/lib/auth/context";
import { parseForm, nullable, type FormState } from "@/lib/forms";
import { optionalText, optionalDate } from "@/lib/forms/fields";
import { logger } from "@/lib/logger";

const assignmentSchema = z.object({
  user_id: z.string().uuid("Select a person"),
  role: z.enum(["manager", "staff"]).default("staff"),
  is_primary: z.string().optional(),
  starts_on: optionalDate,
  notes: optionalText(500),
});

function dbError(error: { code?: string; message: string }, fallback: string): FormState {
  if (error.code === "42501") return { error: "You don’t have permission to change this site’s team." };
  if (error.code === "23505") return { error: "That person is already assigned to this site." };
  logger.error("db.error", { code: error.code, message: error.message });
  return { error: fallback };
}

/** Puts a person on a site, as a manager or as staff. */
export async function assignToSite(siteId: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireOrgContext();
  const p = parseForm(assignmentSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;
  // The employee record is looked up here rather than posted, so the form can't
  // be made to attach someone else's employee row to a user.
  const { data: employee } = await ctx.supabase.from("employees").select("id").eq("user_id", d.user_id).is("archived_at", null).maybeSingle();
  const { error } = await ctx.supabase.from("site_assignments").insert({
    organisation_id: ctx.organisation.id, site_id: siteId, user_id: d.user_id,
    employee_id: employee?.id ?? null, role: d.role, is_primary: d.is_primary === "true",
    starts_on: nullable(d.starts_on), notes: nullable(d.notes), created_by: ctx.user.id,
  });
  if (error) return dbError(error, "Couldn’t assign them to this site.");
  revalidatePath(`/dashboard/sites/${siteId}/staff`);
  revalidatePath(`/dashboard/sites/${siteId}`);
  return { success: "Assigned." };
}

export async function removeFromSite(assignmentId: string, siteId: string) {
  const ctx = await requireOrgContext();
  const { error } = await ctx.supabase.from("site_assignments").delete().eq("id", assignmentId);
  if (error) return { error: "Couldn’t remove them from this site." };
  revalidatePath(`/dashboard/sites/${siteId}/staff`);
}

export async function setAssignmentRole(assignmentId: string, siteId: string, role: "manager" | "staff") {
  const ctx = await requireOrgContext();
  const { error } = await ctx.supabase.from("site_assignments").update({ role }).eq("id", assignmentId);
  if (error) return { error: "Couldn’t change their role at this site." };
  revalidatePath(`/dashboard/sites/${siteId}/staff`);
}

/** Marks this site as the person's base — one primary per person, enforced in the database. */
export async function setPrimarySite(assignmentId: string, siteId: string, userId: string) {
  const ctx = await requireOrgContext();
  await ctx.supabase.from("site_assignments").update({ is_primary: false }).eq("user_id", userId).eq("is_primary", true);
  const { error } = await ctx.supabase.from("site_assignments").update({ is_primary: true }).eq("id", assignmentId);
  if (error) return { error: "Couldn’t set their primary site." };
  revalidatePath(`/dashboard/sites/${siteId}/staff`);
  revalidatePath("/dashboard/employees");
}

export async function archiveSiteRecord(id: string) {
  const ctx = await requireOrgContext();
  if (!ctx.can("org.manage")) return { error: "Only an administrator can close a site." };
  await ctx.supabase.from("sites").update({ archived_at: new Date().toISOString(), status: "closed", closed_on: new Date().toISOString().slice(0, 10) }).eq("id", id);
  revalidatePath("/dashboard/sites");
  return { redirectTo: "/dashboard/sites" };
}
