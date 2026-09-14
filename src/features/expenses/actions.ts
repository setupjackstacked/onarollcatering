"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/auth/context";
import { parseForm, nullable, type FormState } from "@/lib/forms";
import { expenseSchema, estimateSchema } from "./schema";
import { getExpense } from "./queries";
import { logger } from "@/lib/logger";

function dbError(error: { code?: string; message: string }, fallback: string): FormState {
  if (error.code === "42501") return { error: "You don’t have permission to do that." };
  logger.error("db.error", { code: error.code, message: error.message });
  return { error: fallback };
}

function canRaise(ctx: Awaited<ReturnType<typeof requireOrgContext>>) {
  return ctx.can("finance.write") || ctx.role === "project_manager";
}

export async function saveExpense(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireOrgContext();
  if (!canRaise(ctx)) return { error: "You don’t have permission to do that." };
  const p = parseForm(expenseSchema, formData);
  if (!p.ok) return p.state;
  const d = p.data;
  if (!d.project_id && !ctx.can("finance.write")) return { fieldErrors: { project_id: ["Select a project"] } };
  const status = ctx.can("finance.write") ? d.status : "pending";
  const row = { project_id: nullable(d.project_id), supplier_id: nullable(d.supplier_id), supplier_name: nullable(d.supplier_name), category: d.category, expense_date: d.expense_date, description: d.description, net: d.net, vat: d.vat, reference: nullable(d.reference), status, notes: nullable(d.notes) };
  if (id) {
    const { error } = await ctx.supabase.from("expenses").update(row).eq("id", id);
    if (error) return dbError(error, "Couldn’t save the cost.");
    revalidatePath(`/dashboard/expenses/${id}`); revalidatePath("/dashboard/expenses");
    if (row.project_id) revalidatePath(`/dashboard/projects/${row.project_id}/costs`);
    return { success: "Saved.", redirectTo: `/dashboard/expenses/${id}` };
  }
  const { data, error } = await ctx.supabase.from("expenses").insert({ ...row, organisation_id: ctx.organisation.id, created_by: ctx.user.id }).select("id").single();
  if (error || !data) return dbError(error ?? { message: "no row" }, "Couldn’t record the cost.");
  revalidatePath("/dashboard/expenses");
  if (row.project_id) revalidatePath(`/dashboard/projects/${row.project_id}/costs`);
  const ret = String(formData.get("return") ?? "");
  return { success: "Recorded.", redirectTo: ret.startsWith("/dashboard") ? ret : `/dashboard/expenses/${data.id}` };
}

export async function setExpenseStatus(id: string, status: "pending" | "committed" | "actual" | "paid" | "rejected") {
  const ctx = await requireOrgContext();
  if (!ctx.can("finance.write")) return { error: "Only finance can change cost status." };
  const { error } = await ctx.supabase.from("expenses").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  const e = await getExpense(ctx, id);
  revalidatePath(`/dashboard/expenses/${id}`); revalidatePath("/dashboard/expenses");
  if (e?.project_id) revalidatePath(`/dashboard/projects/${e.project_id}/costs`);
}

export async function archiveExpense(id: string) {
  const ctx = await requireOrgContext();
  if (!ctx.can("finance.write")) return { error: "You don’t have permission to do that." };
  await ctx.supabase.from("expenses").update({ archived_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/dashboard/expenses");
  return { redirectTo: "/dashboard/expenses" };
}

export async function attachReceipt(id: string, documentId: string) {
  const ctx = await requireOrgContext();
  await ctx.supabase.from("expenses").update({ receipt_document_id: documentId }).eq("id", id);
  revalidatePath(`/dashboard/expenses/${id}`);
}

export async function saveEstimate(projectId: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireOrgContext();
  const p = parseForm(estimateSchema, formData);
  if (!p.ok) return p.state;
  const { error } = await ctx.supabase.from("project_cost_estimates").upsert({ organisation_id: ctx.organisation.id, project_id: projectId, category: p.data.category, amount: p.data.amount, notes: nullable(p.data.notes) }, { onConflict: "project_id,category" });
  if (error) return dbError(error, "Couldn’t save the estimate.");
  revalidatePath(`/dashboard/projects/${projectId}/costs`); revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: "Estimate saved." };
}

export async function deleteEstimate(projectId: string, category: string) {
  const ctx = await requireOrgContext();
  await ctx.supabase.from("project_cost_estimates").delete().eq("project_id", projectId).eq("category", category as never);
  revalidatePath(`/dashboard/projects/${projectId}/costs`); revalidatePath(`/dashboard/projects/${projectId}`);
}
