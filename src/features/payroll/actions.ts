"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/context";
import { parseForm, nullable, type FormState } from "@/lib/forms";
import { payPeriodSchema, adjustmentSchema, DEFAULT_OVERTIME_MULTIPLIER } from "./schema";
import { getPayPeriod } from "./queries";
import { logger } from "@/lib/logger";

function dbError(error: { code?: string; message: string }, fallback: string): FormState {
  if (error.code === "42501") return { error: "You don’t have permission to do that." };
  if (error.code === "23514" || error.message.includes("finalised")) return { error: error.message.replace(/^[^:]*: /, "") };
  logger.error("db.error", { code: error.code, message: error.message });
  return { error: fallback };
}

export async function savePayPeriod(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const p = parseForm(payPeriodSchema, formData);
  if (!p.ok) return p.state;
  if (p.data.end_date < p.data.start_date) return { fieldErrors: { end_date: ["End date is before the start date"] } };
  const row = { name: p.data.name, start_date: p.data.start_date, end_date: p.data.end_date, pay_date: nullable(p.data.pay_date), notes: nullable(p.data.notes) };
  if (id) {
    const { error } = await ctx.supabase.from("pay_periods").update(row).eq("id", id);
    if (error) return dbError(error, "Couldn’t save the pay period.");
    revalidatePath(`/dashboard/payroll/${id}`);
    return { success: "Saved." };
  }
  const { data, error } = await ctx.supabase.from("pay_periods").insert({ ...row, organisation_id: ctx.organisation.id, created_by: ctx.user.id }).select("id").single();
  if (error || !data) return dbError(error ?? { message: "no row" }, "Couldn’t create the pay period.");
  revalidatePath("/dashboard/payroll");
  return { success: "Created.", redirectTo: `/dashboard/payroll/${data.id}` };
}

export async function buildPeriod(id: string) {
  const ctx = await requirePermission("finance.write");
  const { error } = await ctx.supabase.rpc("build_payroll_period", { p_period_id: id, p_overtime_multiplier: DEFAULT_OVERTIME_MULTIPLIER });
  if (error) return { error: error.message.replace(/^[^:]*: /, "") };
  revalidatePath(`/dashboard/payroll/${id}`);
}

export async function finalisePeriod(id: string) {
  const ctx = await requirePermission("finance.write");
  const { error } = await ctx.supabase.rpc("finalise_payroll_period", { p_period_id: id });
  if (error) return { error: error.message.replace(/^[^:]*: /, "") };
  revalidatePath(`/dashboard/payroll/${id}`); revalidatePath("/dashboard/timesheets");
}

export async function reopenPeriod(id: string) {
  const ctx = await requirePermission("org.manage");
  const { error } = await ctx.supabase.rpc("reopen_payroll_period", { p_period_id: id });
  if (error) return { error: error.message.replace(/^[^:]*: /, "") };
  revalidatePath(`/dashboard/payroll/${id}`); revalidatePath("/dashboard/timesheets");
}

export async function deletePayPeriod(id: string) {
  const ctx = await requirePermission("finance.write");
  const period = await getPayPeriod(ctx, id);
  if (period && (period.status === "finalised" || period.status === "exported")) return { error: "Reopen the period before deleting it." };
  await ctx.supabase.from("pay_periods").delete().eq("id", id);
  revalidatePath("/dashboard/payroll");
  return { redirectTo: "/dashboard/payroll" };
}

export async function addAdjustment(entryId: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("finance.write");
  const p = parseForm(adjustmentSchema, formData);
  if (!p.ok) return p.state;
  const signed = p.data.kind === "deduction" ? -Math.abs(Number(p.data.amount)) : Number(p.data.amount);
  const { error } = await ctx.supabase.from("payroll_adjustments").insert({
    organisation_id: ctx.organisation.id, payroll_entry_id: entryId, kind: p.data.kind, label: p.data.label, amount: signed.toFixed(2), created_by: ctx.user.id,
  });
  if (error) return dbError(error, "Couldn’t add the adjustment.");
  revalidatePath("/dashboard/payroll", "layout");
  return { success: "Adjustment added." };
}

export async function deleteAdjustment(id: string, periodId: string) {
  const ctx = await requirePermission("finance.write");
  await ctx.supabase.from("payroll_adjustments").delete().eq("id", id);
  revalidatePath(`/dashboard/payroll/${periodId}`);
}

export async function markExported(id: string) {
  const ctx = await requirePermission("finance.write");
  await ctx.supabase.from("pay_periods").update({ status: "exported", exported_at: new Date().toISOString() }).eq("id", id).eq("status", "finalised");
  revalidatePath(`/dashboard/payroll/${id}`);
}
