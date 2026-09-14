import "server-only";

import { cache } from "react";
import type { OrgContext } from "@/lib/auth/context";
import { pageParams, str } from "@/lib/pagination";
import type { ExpenseStatus, CostCategory } from "@/lib/supabase/types";

const LIST = "id, expense_date, description, category, net, vat, gross, status, reference, supplier_name, supplier_id, suppliers(id, name), project_id, projects(name, project_number)";

export async function listExpenses(ctx: OrgContext, sp: Record<string, string | string[] | undefined>, filter?: { projectId?: string; supplierId?: string }) {
  const { from, to, page, size } = pageParams(sp);
  const q = str(sp.q), status = str(sp.status), category = str(sp.category);
  let query = ctx.supabase.from("expenses").select(LIST, { count: "exact" }).eq("organisation_id", ctx.organisation.id).is("archived_at", null).order("expense_date", { ascending: false }).order("created_at", { ascending: false }).range(from, to);
  if (q) query = query.or(`description.ilike.%${q}%,reference.ilike.%${q}%,supplier_name.ilike.%${q}%`);
  if (status) query = query.eq("status", status as ExpenseStatus);
  if (category) query = query.eq("category", category as CostCategory);
  if (filter?.projectId) query = query.eq("project_id", filter.projectId);
  if (filter?.supplierId) query = query.eq("supplier_id", filter.supplierId);
  const { data, count } = await query;
  return { rows: data ?? [], total: count ?? 0, page, size };
}

export const getExpense = cache(async (ctx: OrgContext, id: string) => {
  const { data } = await ctx.supabase.from("expenses").select("*, projects(id, name, project_number), suppliers(id, name), documents:receipt_document_id(id, name, mime_type, size_bytes)").eq("id", id).maybeSingle();
  return data;
});

export async function projectFinancials(ctx: OrgContext, projectId: string) {
  const { data } = await ctx.supabase.from("project_financials").select("*").eq("project_id", projectId).maybeSingle();
  return data;
}

export type CostBreakdownRow = { category: CostCategory; estimated: string; committed: string; actual: string };

export async function projectCostBreakdown(ctx: OrgContext, projectId: string): Promise<CostBreakdownRow[]> {
  const { data } = await ctx.supabase.rpc("project_cost_breakdown", { p_project_id: projectId });
  return (data ?? []) as unknown as CostBreakdownRow[];
}

export async function listEstimates(ctx: OrgContext, projectId: string) {
  const { data } = await ctx.supabase.from("project_cost_estimates").select("*").eq("project_id", projectId);
  return data ?? [];
}

export async function expenseTotals(ctx: OrgContext, sp: Record<string, string | string[] | undefined>) {
  const { data } = await ctx.supabase.from("expenses").select("status, net").eq("organisation_id", ctx.organisation.id).is("archived_at", null).gte("expense_date", str(sp.from) || "1900-01-01");
  const t = { pending: 0, committed: 0, actual: 0 };
  for (const r of data ?? []) {
    const p = Math.round(Number(r.net) * 100);
    if (r.status === "pending") t.pending += p; else if (r.status === "committed") t.committed += p; else if (r.status === "actual" || r.status === "paid") t.actual += p;
  }
  return t;
}
