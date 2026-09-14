import "server-only";

import type { OrgContext } from "@/lib/auth/context";
import { pageParams, str } from "@/lib/pagination";
import type { EnquiryStatus } from "@/lib/supabase/types";

export async function listEnquiries(ctx: OrgContext, sp: Record<string, string | string[] | undefined>) {
  const { from, to, page, size } = pageParams(sp);
  const status = str(sp.status) || "new";
  const q = str(sp.q);
  let query = ctx.supabase
    .from("enquiries")
    .select("id, company_name, contact_name, email, project_name, location, services, status, created_at, lead_id", { count: "exact" })
    .eq("organisation_id", ctx.organisation.id)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (status !== "all") query = query.eq("status", status as EnquiryStatus);
  if (q) query = query.or(`company_name.ilike.%${q}%,project_name.ilike.%${q}%,contact_name.ilike.%${q}%`);
  const { data, count } = await query;
  return { rows: data ?? [], total: count ?? 0, page, size };
}

export async function getEnquiry(ctx: OrgContext, id: string) {
  const { data } = await ctx.supabase.from("enquiries").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function enquiryCounts(ctx: OrgContext) {
  const { data } = await ctx.supabase.from("enquiries").select("status").eq("organisation_id", ctx.organisation.id);
  const counts: Record<string, number> = {};
  for (const r of data ?? []) counts[r.status] = (counts[r.status] ?? 0) + 1;
  return counts;
}
