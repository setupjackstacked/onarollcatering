import "server-only";

import { cache } from "react";
import type { OrgContext } from "@/lib/auth/context";
import { pageParams, str } from "@/lib/pagination";
import type { InvoiceStatus } from "@/lib/supabase/types";

const LIST = "id, invoice_number, kind, title, status, client_id, clients(name), project_id, total, amount_paid, issue_date, due_date, updated_at";

export async function listInvoices(ctx: OrgContext, sp: Record<string, string | string[] | undefined>, filter?: { clientId?: string; projectId?: string }) {
  const { from, to, page, size } = pageParams(sp);
  const q = str(sp.q), status = str(sp.status);
  let query = ctx.supabase.from("invoices").select(LIST, { count: "exact" }).eq("organisation_id", ctx.organisation.id).is("archived_at", null).order("updated_at", { ascending: false }).range(from, to);
  if (q) query = query.or(`title.ilike.%${q}%,invoice_number.ilike.%${q}%,reference.ilike.%${q}%`);
  if (status === "outstanding") query = query.in("status", ["issued", "part_paid", "overdue"]);
  else if (status) query = query.eq("status", status as InvoiceStatus);
  if (filter?.clientId) query = query.eq("client_id", filter.clientId);
  if (filter?.projectId) query = query.eq("project_id", filter.projectId);
  const { data, count } = await query;
  return { rows: data ?? [], total: count ?? 0, page, size };
}

export const getInvoice = cache(async (ctx: OrgContext, id: string) => {
  const { data } = await ctx.supabase.from("invoices").select("*, clients(id, name, email, billing_address, payment_terms_days), client_contacts(id, first_name, last_name, email), projects(id, name, project_number), quotes(id, quote_number)").eq("id", id).maybeSingle();
  return data;
});

export async function listInvoiceItems(ctx: OrgContext, invoiceId: string) {
  const { data } = await ctx.supabase.from("invoice_items").select("*").eq("invoice_id", invoiceId).order("position");
  return data ?? [];
}

export async function listPayments(ctx: OrgContext, invoiceId: string) {
  const { data } = await ctx.supabase.from("payments").select("*").eq("invoice_id", invoiceId).order("paid_on", { ascending: false });
  return data ?? [];
}

export async function outstandingSummary(ctx: OrgContext) {
  const { data } = await ctx.supabase.from("invoices").select("status, total, amount_paid, due_date").eq("organisation_id", ctx.organisation.id).in("status", ["issued", "part_paid", "overdue"]).is("archived_at", null);
  let outstanding = 0, overdue = 0, count = 0;
  for (const r of data ?? []) {
    const bal = Math.round((Number(r.total) - Number(r.amount_paid)) * 100);
    outstanding += bal; count++;
    if (r.status === "overdue") overdue += bal;
  }
  return { outstanding, overdue, count };
}

export async function listCreditNotesFor(ctx: OrgContext, invoiceId: string) {
  const { data } = await ctx.supabase.from("invoices").select("id, invoice_number, status, total").eq("credit_for_invoice_id", invoiceId).is("archived_at", null).order("created_at");
  return data ?? [];
}

export async function listAllPayments(ctx: OrgContext, sp: Record<string, string | string[] | undefined>) {
  const { from, to, page, size } = pageParams(sp);
  const q = str(sp.q), method = str(sp.method);
  let query = ctx.supabase.from("payments").select("id, paid_on, amount, method, reference, invoice_id, invoices(invoice_number, title, clients(name))", { count: "exact" }).eq("organisation_id", ctx.organisation.id).order("paid_on", { ascending: false }).range(from, to);
  if (q) query = query.or(`reference.ilike.%${q}%`);
  if (method) query = query.eq("method", method as never);
  const { data, count } = await query;
  return { rows: data ?? [], total: count ?? 0, page, size };
}
