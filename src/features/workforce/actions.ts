"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requirePermission } from "@/lib/auth/context";
import { parseForm, nullable, type FormState } from "@/lib/forms";
import { employeeSchema, shiftSchema, timesheetSchema, leaveSchema } from "./schema";
import { getEmployee, getTimesheet, myEmployee, shiftConflicts } from "./queries";
import { logger } from "@/lib/logger";

function dbError(error: { code?: string; message: string }, fallback: string): FormState {
  if (error.code === "42501") return { error: "You don’t have permission to do that." };
  if (error.code === "23505") return { error: "That record already exists." };
  logger.error("db.error", { code: error.code, message: error.message });
  return { error: fallback };
}

// ---------- employees --------------------------------------------------------
export async function saveEmployee(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("workforce.write");
  const p = parseForm(employeeSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;
  const row = {
    first_name: d.first_name, last_name: d.last_name, email: nullable(d.email), phone: nullable(d.phone),
    address: { line1: d.address_line1 || null, city: d.address_city || null, postcode: d.address_postcode || null },
    emergency_contact: { name: d.emergency_name || null, relationship: d.emergency_relationship || null, phone: d.emergency_phone || null },
    role_key: d.role_key, employment_type: d.employment_type, start_date: nullable(d.start_date), end_date: nullable(d.end_date),
    hourly_rate: d.hourly_rate && Number(d.hourly_rate) > 0 ? d.hourly_rate : null,
    salary: d.salary && Number(d.salary) > 0 ? d.salary : null,
    status: d.status, notes: nullable(d.notes),
  };
  if (id) {
    const { error } = await ctx.supabase.from("employees").update(row).eq("id", id);
    if (error) return dbError(error, "Couldn’t save the employee.");
    revalidatePath(`/dashboard/employees/${id}`);
    return { success: "Saved.", redirectTo: `/dashboard/employees/${id}` };
  }
  const { data, error } = await ctx.supabase.from("employees").insert({ ...row, employee_number: "", organisation_id: ctx.organisation.id, created_by: ctx.user.id }).select("id").single();
  if (error || !data) return dbError(error ?? { message: "no row" }, "Couldn’t add the employee.");
  revalidatePath("/dashboard/employees");
  return { success: "Added.", redirectTo: `/dashboard/employees/${data.id}` };
}

export async function archiveEmployee(id: string) {
  const ctx = await requirePermission("workforce.write");
  await ctx.supabase.from("employees").update({ archived_at: new Date().toISOString(), status: "former" }).eq("id", id);
  revalidatePath("/dashboard/employees");
  return { redirectTo: "/dashboard/employees" };
}

/** Links an employee record to an existing organisation member so they can use the staff portal. */
export async function linkEmployeeUser(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("workforce.write");
  const userId = String(formData.get("user_id") ?? "");
  const { error } = await ctx.supabase.from("employees").update({ user_id: userId || null }).eq("id", id);
  if (error) return dbError(error, "Couldn’t link the account.");
  revalidatePath(`/dashboard/employees/${id}`);
  return { success: userId ? "Account linked." : "Account unlinked." };
}

export async function setDocumentVerification(documentId: string, verification: "unverified" | "verified" | "rejected", employeeId: string) {
  const ctx = await requirePermission("workforce.write");
  await ctx.supabase.from("documents").update({ verification, verified_by: ctx.user.id, verified_at: new Date().toISOString() }).eq("id", documentId);
  revalidatePath(`/dashboard/employees/${employeeId}/documents`);
}

// ---------- rota -------------------------------------------------------------
/** Warnings for a proposed shift — never blocks (spec §48). */
export async function checkShift(args: { employeeId: string; date: string; start: string; end: string; excludeShiftId?: string }) {
  const ctx = await requireOrgContext();
  if (!ctx.can("workforce.read")) return [];
  return shiftConflicts(ctx, args);
}

export async function saveShift(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireOrgContext();
  const p = parseForm(shiftSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;
  const row = { employee_id: d.employee_id, project_id: nullable(d.project_id), site_id: nullable(d.site_id), shift_date: d.shift_date, start_time: d.start_time, end_time: d.end_time, break_minutes: d.break_minutes, role_key: nullable(d.role_key), status: d.status, notes: nullable(d.notes) };
  const r = id
    ? await ctx.supabase.from("shifts").update(row).eq("id", id)
    : await ctx.supabase.from("shifts").insert({ ...row, organisation_id: ctx.organisation.id, created_by: ctx.user.id });
  if (r.error) return dbError(r.error, "Couldn’t save the shift.");
  revalidatePath("/dashboard/rota");
  if (row.project_id) revalidatePath(`/dashboard/projects/${row.project_id}/staff`);
  return { success: id ? "Shift updated." : "Shift added.", redirectTo: String(formData.get("return") || "/dashboard/rota") };
}

export async function deleteShift(id: string) {
  const ctx = await requireOrgContext();
  await ctx.supabase.from("shifts").delete().eq("id", id);
  revalidatePath("/dashboard/rota");
}

export async function publishShifts(ids: string[]) {
  const ctx = await requireOrgContext();
  if (!ids.length) return;
  await ctx.supabase.from("shifts").update({ status: "published" }).in("id", ids).eq("status", "draft");
  revalidatePath("/dashboard/rota");
}

export async function logTimesheetFromShift(shiftId: string) {
  const ctx = await requireOrgContext();
  const { data, error } = await ctx.supabase.rpc("timesheet_from_shift", { p_shift_id: shiftId });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/timesheets");
  return { redirectTo: `/dashboard/timesheets/${data}` };
}

// ---------- timesheets -------------------------------------------------------
export async function saveTimesheet(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireOrgContext();
  const p = parseForm(timesheetSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;
  const row = { employee_id: d.employee_id, project_id: nullable(d.project_id), site_id: nullable(d.site_id), work_date: d.work_date, start_time: d.start_time, end_time: d.end_time, break_minutes: d.break_minutes, overtime_hours: d.overtime_hours.toFixed(2), notes: nullable(d.notes) };
  const r = id
    ? await ctx.supabase.from("timesheets").update(row).eq("id", id)
    : await ctx.supabase.from("timesheets").insert({ ...row, organisation_id: ctx.organisation.id, created_by: ctx.user.id });
  if (r.error) return dbError(r.error, "Couldn’t save the timesheet.");
  revalidatePath("/dashboard/timesheets");
  return { success: "Saved.", redirectTo: String(formData.get("return") || "/dashboard/timesheets") };
}

export async function setTimesheetStatus(id: string, status: "draft" | "submitted" | "approved" | "rejected" | "paid", note?: string) {
  const ctx = await requireOrgContext();
  const patch = { status, ...(status === "rejected" && note ? { rejection_note: note } : {}) };
  const { error } = await ctx.supabase.from("timesheets").update(patch).eq("id", id);
  if (error) return { error: error.code === "42501" ? "Only a manager can approve timesheets." : error.message };
  const ts = await getTimesheet(ctx, id);
  revalidatePath("/dashboard/timesheets"); revalidatePath(`/dashboard/timesheets/${id}`);
  if (ts?.project_id) revalidatePath(`/dashboard/projects/${ts.project_id}/costs`);
}

export async function rejectTimesheet(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const note = String(formData.get("rejection_note") ?? "").trim();
  if (note.length < 3) return { fieldErrors: { rejection_note: ["Say why so it can be corrected"] } };
  const r = await setTimesheetStatus(id, "rejected", note);
  if (r?.error) return { error: r.error };
  return { success: "Returned to the employee." };
}

export async function bulkApproveTimesheets(ids: string[]) {
  const ctx = await requireOrgContext();
  for (const id of ids) {
    await ctx.supabase.from("timesheets").update({ status: "approved" }).eq("id", id).eq("status", "submitted");
  }
  revalidatePath("/dashboard/timesheets");
}

export async function deleteTimesheet(id: string) {
  const ctx = await requireOrgContext();
  await ctx.supabase.from("timesheets").delete().eq("id", id);
  revalidatePath("/dashboard/timesheets");
  return { redirectTo: "/dashboard/timesheets" };
}

// ---------- leave ------------------------------------------------------------
export async function saveLeave(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireOrgContext();
  const p = parseForm(leaveSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;
  if (d.end_date < d.start_date) return { fieldErrors: { end_date: ["End date is before the start date"] } };
  const row = { employee_id: d.employee_id, leave_type: d.leave_type, start_date: d.start_date, end_date: d.end_date, days: d.days.toFixed(2), reason: nullable(d.reason) };
  const r = id
    ? await ctx.supabase.from("leave_requests").update(row).eq("id", id)
    : await ctx.supabase.from("leave_requests").insert({ ...row, organisation_id: ctx.organisation.id });
  if (r.error) return dbError(r.error, "Couldn’t save the leave request.");
  revalidatePath("/dashboard/leave");
  return { success: id ? "Updated." : "Requested.", redirectTo: String(formData.get("return") || "/dashboard/leave") };
}

export async function setLeaveStatus(id: string, status: "approved" | "rejected" | "cancelled", note?: string) {
  const ctx = await requireOrgContext();
  const { error } = await ctx.supabase.from("leave_requests").update({ status, decision_note: note ?? null }).eq("id", id);
  if (error) return { error: error.code === "42501" ? "Only a manager can decide leave requests." : error.message };
  revalidatePath("/dashboard/leave");
}

/** Used by the staff portal: the employee record for the signed-in user. */
export async function requireMyEmployee() {
  const ctx = await requireOrgContext("/staff");
  return { ctx, employee: await myEmployee(ctx) };
}

export async function employeeForUser(id: string) {
  const ctx = await requirePermission("workforce.write");
  return getEmployee(ctx, id);
}
