import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { requireOrgContext, type OrgContext } from "@/lib/auth/context";
import { isoDateOffset } from "@/lib/dates";
import type { Tables } from "@/lib/supabase/types";

export type StaffContext = { ctx: OrgContext; employee: Tables<"employees"> };

/**
 * Staff portal context. Every member sees only their own record; anyone whose
 * account isn't linked to an employee is sent to a page that says so honestly.
 */
export const requireStaff = cache(async (next = "/staff"): Promise<StaffContext> => {
  const ctx = await requireOrgContext(next);
  const { data } = await ctx.supabase.from("employees").select("*").eq("user_id", ctx.user.id).is("archived_at", null).maybeSingle();
  if (!data) redirect("/staff/no-record");
  return { ctx, employee: data };
});

export async function myShifts(ctx: OrgContext, employeeId: string, range: { from: string; to: string }) {
  const { data } = await ctx.supabase.from("shifts").select("*, projects(id, name, project_number), sites(id, name, address, postcode, access_details)")
    .eq("employee_id", employeeId).eq("status", "published").gte("shift_date", range.from).lte("shift_date", range.to)
    .order("shift_date").order("start_time").limit(200);
  return data ?? [];
}

export async function myNextShift(ctx: OrgContext, employeeId: string) {
  const { data } = await ctx.supabase.from("shifts").select("*, projects(id, name, project_number), sites(id, name, address, postcode, access_details)")
    .eq("employee_id", employeeId).eq("status", "published").gte("shift_date", isoDateOffset(0))
    .order("shift_date").order("start_time").limit(1).maybeSingle();
  return data;
}

export async function myTimesheets(ctx: OrgContext, employeeId: string, limit = 30) {
  const { data } = await ctx.supabase.from("timesheets").select("*, projects(id, name, project_number)")
    .eq("employee_id", employeeId).order("work_date", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function myLeave(ctx: OrgContext, employeeId: string) {
  const { data } = await ctx.supabase.from("leave_requests").select("*").eq("employee_id", employeeId).order("start_date", { ascending: false }).limit(50);
  return data ?? [];
}

export async function myDocuments(ctx: OrgContext, employeeId: string) {
  const { data } = await ctx.supabase.from("documents").select("id, name, category_key, mime_type, size_bytes, expiry_date, verification, created_at")
    .eq("entity_type", "employee").eq("entity_id", employeeId).is("archived_at", null).order("created_at", { ascending: false });
  return data ?? [];
}

/** Shifts in the last 14 days with no timesheet yet — the "log your hours" nudge. */
export async function shiftsAwaitingHours(ctx: OrgContext, employeeId: string) {
  const [shifts, sheets] = await Promise.all([
    ctx.supabase.from("shifts").select("id, shift_date, start_time, end_time, break_minutes, project_id, projects(name)")
      .eq("employee_id", employeeId).eq("status", "published")
      .gte("shift_date", isoDateOffset(-14)).lte("shift_date", isoDateOffset(0)).order("shift_date", { ascending: false }),
    ctx.supabase.from("timesheets").select("shift_id").eq("employee_id", employeeId).not("shift_id", "is", null),
  ]);
  const logged = new Set((sheets.data ?? []).map((t) => t.shift_id));
  return (shifts.data ?? []).filter((s) => !logged.has(s.id));
}
