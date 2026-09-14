import "server-only";

import type { OrgContext } from "@/lib/auth/context";
import { pageParams, str } from "@/lib/pagination";
import { OPEN_LEAD_STATUSES } from "@/lib/domain/statuses";
import type { LeadStatus } from "@/lib/supabase/types";

const LEAD_LIST = "id, title, status, company_name, client_id, clients(name), estimated_value, source_key, assigned_user_id, expected_start_date, created_at, updated_at, converted_project_id";

export async function listLeads(ctx: OrgContext, sp: Record<string, string | string[] | undefined>) {
  const { from, to, page, size } = pageParams(sp);
  const q = str(sp.q), status = str(sp.status), assigned = str(sp.assigned), source = str(sp.source);
  let query = ctx.supabase.from("leads").select(LEAD_LIST, { count: "exact" }).eq("organisation_id", ctx.organisation.id).is("archived_at", null).order("updated_at", { ascending: false }).range(from, to);
  if (q) query = query.or(`title.ilike.%${q}%,company_name.ilike.%${q}%`);
  if (status === "open") query = query.in("status", OPEN_LEAD_STATUSES);
  else if (status) query = query.eq("status", status as LeadStatus);
  if (assigned === "me") query = query.eq("assigned_user_id", ctx.user.id);
  else if (assigned) query = query.eq("assigned_user_id", assigned);
  if (source) query = query.eq("source_key", source);
  const { data, count } = await query;
  return { rows: data ?? [], total: count ?? 0, page, size };
}

/** All open leads grouped by status for the pipeline board. */
export async function pipeline(ctx: OrgContext) {
  const { data } = await ctx.supabase.from("leads").select(LEAD_LIST).eq("organisation_id", ctx.organisation.id).is("archived_at", null).in("status", OPEN_LEAD_STATUSES).order("updated_at", { ascending: false }).limit(500);
  return data ?? [];
}

export async function getLead(ctx: OrgContext, id: string) {
  const { data } = await ctx.supabase.from("leads").select("*, clients(id, name), client_contacts(id, first_name, last_name, email, phone, mobile)").eq("id", id).maybeSingle();
  return data;
}
