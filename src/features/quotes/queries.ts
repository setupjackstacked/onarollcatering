import "server-only";

import { cache } from "react";
import type { OrgContext } from "@/lib/auth/context";
import { pageParams, str } from "@/lib/pagination";
import type { QuoteStatus } from "@/lib/supabase/types";

const LIST = "id, quote_number, revision, title, status, client_id, clients(name), project_id, total, cost_total, vat_amount, issue_date, expiry_date, created_by, updated_at, converted_project_id, converted_invoice_id";

export async function listQuotes(ctx: OrgContext, sp: Record<string, string | string[] | undefined>, filter?: { clientId?: string; projectId?: string }) {
  const { from, to, page, size } = pageParams(sp);
  const q = str(sp.q), status = str(sp.status);
  let query = ctx.supabase.from("quotes").select(LIST, { count: "exact" }).eq("organisation_id", ctx.organisation.id).is("archived_at", null).order("updated_at", { ascending: false }).range(from, to);
  if (q) query = query.or(`title.ilike.%${q}%,quote_number.ilike.%${q}%`);
  if (status === "open") query = query.in("status", ["draft", "sent", "viewed"]);
  else if (status) query = query.eq("status", status as QuoteStatus);
  else query = query.neq("status", "superseded");
  if (filter?.clientId) query = query.eq("client_id", filter.clientId);
  if (filter?.projectId) query = query.eq("project_id", filter.projectId);
  const { data, count } = await query;
  return { rows: data ?? [], total: count ?? 0, page, size };
}

export const getQuote = cache(async (ctx: OrgContext, id: string) => {
  const { data } = await ctx.supabase
    .from("quotes")
    .select("*, clients(id, name, email, billing_address, payment_terms_days), client_contacts(id, first_name, last_name, email), projects(id, name, project_number)")
    .eq("id", id)
    .maybeSingle();
  return data;
});

export async function listQuoteItems(ctx: OrgContext, quoteId: string) {
  const { data } = await ctx.supabase.from("quote_items").select("*").eq("quote_id", quoteId).order("position");
  return data ?? [];
}

export async function listRevisions(ctx: OrgContext, rootId: string) {
  const { data } = await ctx.supabase.from("quotes").select("id, revision, status, total, created_at").eq("root_quote_id", rootId).order("revision");
  return data ?? [];
}

export async function listVatRates(ctx: OrgContext) {
  const { data } = await ctx.supabase.from("vat_rates").select("key, label, rate, is_default").eq("organisation_id", ctx.organisation.id).eq("active", true).order("sort_order");
  return data ?? [];
}

export async function listCatalogue(ctx: OrgContext) {
  const { data } = await ctx.supabase.from("catalogue_items").select("id, name, category, description, unit, cost_price, sell_price, vat_rate_key").eq("organisation_id", ctx.organisation.id).eq("active", true).order("category").order("name").limit(1000);
  return data ?? [];
}
