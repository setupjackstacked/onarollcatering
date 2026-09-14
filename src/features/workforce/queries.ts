import "server-only";

import { cache } from "react";
import type { OrgContext } from "@/lib/auth/context";
import { pageParams, str } from "@/lib/pagination";
import type { EmployeeStatus, ShiftStatus, TimesheetStatus, LeaveStatus } from "@/lib/supabase/types";
import { isoDateOffset } from "@/lib/dates";

/** Employee roles lookup (customisable per organisation). */
export const listEmployeeRoles = cache(async (ctx: OrgContext) => {
  const { data } = await ctx.supabase.from("employee_roles").select("key, label").eq("organisation_id", ctx.organisation.id).eq("active", true).order("sort_order");
  return data ?? [];
});

/** Directory: safe for schedulers — no pay, address or notes. */
export const listEmployeeOptions = cache(async (ctx: OrgContext) => {
  const { data } = await ctx.supabase.from("employee_directory").select("id, full_name, role_key, status").eq("organisation_id", ctx.organisation.id).is("archived_at", null).order("full_name").limit(500);
  return (data ?? []).filter((e) => e.status === "active").map((e) => ({ value: e.id!, label: e.full_name! }));
});

export const employeeMap = cache(async (ctx: OrgContext) => {
  const { data } = await ctx.supabase.from("employee_directory").select("id, full_name, role_key, employee_number, status, user_id").eq("organisation_id", ctx.organisation.id).limit(1000);
  return new Map((data ?? []).map((e) => [e.id!, e]));
});

export async function listEmployees(ctx: OrgContext, sp: Record<string, string | string[] | undefined>) {
  const { from, to, page, size } = pageParams(sp);
  const q = str(sp.q), status = str(sp.status) || "active", role = str(sp.role);
  let query = ctx.supabase.from("employees").select("id, employee_number, first_name, last_name, email, phone, role_key, employment_type, status, start_date, user_id", { count: "exact" })
    .eq("organisation_id", ctx.organisation.id).is("archived_at", null).order("last_name").range(from, to);
  if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,employee_number.ilike.%${q}%`);
  if (status !== "all") query = query.eq("status", status as EmployeeStatus);
  if (role) query = query.eq("role_key", role);
  const { data, count } = await query;
  return { rows: data ?? [], total: count ?? 0, page, size };
}

export const getEmployee = cache(async (ctx: OrgContext, id: string) => {
  const { data } = await ctx.supabase.from("employees").select("*").eq("id", id).maybeSingle();
  return data;
});

export async function employeeCounts(ctx: OrgContext, id: string) {
  const [docs, shifts, timesheets, leave] = await Promise.all([
    ctx.supabase.from("documents").select("id", { count: "exact", head: true }).eq("entity_type", "employee").eq("entity_id", id).is("archived_at", null),
    ctx.supabase.from("shifts").select("id", { count: "exact", head: true }).eq("employee_id", id).gte("shift_date", isoDateOffset(0)),
    ctx.supabase.from("timesheets").select("id", { count: "exact", head: true }).eq("employee_id", id),
    ctx.supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("employee_id", id),
  ]);
  return { documents: docs.count ?? 0, shifts: shifts.count ?? 0, timesheets: timesheets.count ?? 0, leave: leave.count ?? 0 };
}

export async function listEmployeeDocuments(ctx: OrgContext, id: string) {
  const { data } = await ctx.supabase.from("documents").select("id, name, category_key, mime_type, size_bytes, expiry_date, verification, verified_at, created_at").eq("entity_type", "employee").eq("entity_id", id).is("archived_at", null).order("created_at", { ascending: false });
  return data ?? [];
}

/** Compliance documents expiring within `days` (or already expired). */
export async function expiringDocuments(ctx: OrgContext, days = 90) {
  const { data } = await ctx.supabase.from("documents").select("id, name, category_key, entity_id, expiry_date, verification")
    .eq("organisation_id", ctx.organisation.id).eq("entity_type", "employee").is("archived_at", null)
    .not("expiry_date", "is", null).lte("expiry_date", isoDateOffset(days)).order("expiry_date");
  return data ?? [];
}

// ---------- rota -------------------------------------------------------------
export async function listShifts(ctx: OrgContext, range: { from: string; to: string }, filter?: { projectId?: string; employeeId?: string; status?: string }) {
  let q = ctx.supabase.from("shifts").select("*, projects(id, name, project_number), sites(id, name)")
    .eq("organisation_id", ctx.organisation.id).gte("shift_date", range.from).lte("shift_date", range.to)
    .order("shift_date").order("start_time").limit(1000);
  if (filter?.projectId) q = q.eq("project_id", filter.projectId);
  if (filter?.employeeId) q = q.eq("employee_id", filter.employeeId);
  if (filter?.status) q = q.eq("status", filter.status as ShiftStatus);
  const { data } = await q;
  return data ?? [];
}

export const getShift = cache(async (ctx: OrgContext, id: string) => {
  const { data } = await ctx.supabase.from("shifts").select("*").eq("id", id).maybeSingle();
  return data;
});

export async function shiftConflicts(ctx: OrgContext, args: { employeeId: string; date: string; start: string; end: string; excludeShiftId?: string }) {
  const { data } = await ctx.supabase.rpc("shift_conflicts", {
    p_employee_id: args.employeeId, p_date: args.date, p_start: args.start, p_end: args.end, p_exclude_shift: args.excludeShiftId ?? undefined,
  });
  return (data ?? []) as unknown as { kind: string; detail: string }[];
}

// ---------- timesheets -------------------------------------------------------
export async function listTimesheets(ctx: OrgContext, sp: Record<string, string | string[] | undefined>, filter?: { projectId?: string; employeeId?: string }) {
  const { from, to, page, size } = pageParams(sp);
  const status = str(sp.status), fromDate = str(sp.from), toDate = str(sp.to);
  let q = ctx.supabase.from("timesheets").select("*, projects(id, name, project_number)", { count: "exact" })
    .eq("organisation_id", ctx.organisation.id).order("work_date", { ascending: false }).range(from, to);
  if (status) q = q.eq("status", status as TimesheetStatus);
  if (fromDate) q = q.gte("work_date", fromDate);
  if (toDate) q = q.lte("work_date", toDate);
  if (filter?.projectId) q = q.eq("project_id", filter.projectId);
  if (filter?.employeeId) q = q.eq("employee_id", filter.employeeId);
  const { data, count } = await q;
  return { rows: data ?? [], total: count ?? 0, page, size };
}

export const getTimesheet = cache(async (ctx: OrgContext, id: string) => {
  const { data } = await ctx.supabase.from("timesheets").select("*, projects(id, name, project_number)").eq("id", id).maybeSingle();
  return data;
});

export async function pendingTimesheetCount(ctx: OrgContext) {
  const { count } = await ctx.supabase.from("timesheets").select("id", { count: "exact", head: true }).eq("organisation_id", ctx.organisation.id).eq("status", "submitted");
  return count ?? 0;
}

// ---------- leave ------------------------------------------------------------
export async function listLeave(ctx: OrgContext, sp: Record<string, string | string[] | undefined>, filter?: { employeeId?: string }) {
  const { from, to, page, size } = pageParams(sp);
  const status = str(sp.status);
  let q = ctx.supabase.from("leave_requests").select("*", { count: "exact" }).eq("organisation_id", ctx.organisation.id).order("start_date", { ascending: false }).range(from, to);
  if (status) q = q.eq("status", status as LeaveStatus);
  if (filter?.employeeId) q = q.eq("employee_id", filter.employeeId);
  const { data, count } = await q;
  return { rows: data ?? [], total: count ?? 0, page, size };
}

export async function pendingLeaveCount(ctx: OrgContext) {
  const { count } = await ctx.supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("organisation_id", ctx.organisation.id).eq("status", "requested");
  return count ?? 0;
}

/** The signed-in user's own employee record, if they have one (staff portal). */
export const myEmployee = cache(async (ctx: OrgContext) => {
  const { data } = await ctx.supabase.from("employees").select("*").eq("user_id", ctx.user.id).is("archived_at", null).maybeSingle();
  return data;
});
