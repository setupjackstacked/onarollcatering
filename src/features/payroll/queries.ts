import "server-only";

import { cache } from "react";
import type { OrgContext } from "@/lib/auth/context";
import { pageParams } from "@/lib/pagination";

export async function listPayPeriods(ctx: OrgContext, sp: Record<string, string | string[] | undefined>) {
  const { from, to, page, size } = pageParams(sp);
  const { data, count } = await ctx.supabase.from("pay_periods").select("*", { count: "exact" })
    .eq("organisation_id", ctx.organisation.id).order("start_date", { ascending: false }).range(from, to);
  return { rows: data ?? [], total: count ?? 0, page, size };
}

export const getPayPeriod = cache(async (ctx: OrgContext, id: string) => {
  const { data } = await ctx.supabase.from("pay_periods").select("*").eq("id", id).maybeSingle();
  return data;
});

export async function listPayrollEntries(ctx: OrgContext, periodId: string) {
  const { data } = await ctx.supabase.from("payroll_entries").select("*, payroll_adjustments(id, kind, label, amount)").eq("pay_period_id", periodId).order("created_at");
  return data ?? [];
}

export async function payPeriodTotals(ctx: OrgContext, periodId: string) {
  const rows = await listPayrollEntries(ctx, periodId);
  let hours = 0, overtime = 0, gross = 0, expenses = 0;
  for (const r of rows) {
    hours += Number(r.standard_hours); overtime += Number(r.overtime_hours);
    gross += Math.round(Number(r.gross_pay) * 100); expenses += Math.round(Number(r.expenses) * 100);
  }
  return { employees: rows.length, hours, overtime, gross, expenses };
}

/** Approved timesheets in a period that are not yet on an entry — the "unbuilt" signal. */
export async function unbuiltTimesheetCount(ctx: OrgContext, period: { start_date: string; end_date: string }) {
  const { count } = await ctx.supabase.from("timesheets").select("id", { count: "exact", head: true })
    .eq("organisation_id", ctx.organisation.id).eq("status", "approved")
    .gte("work_date", period.start_date).lte("work_date", period.end_date).is("payroll_entry_id", null);
  return count ?? 0;
}
