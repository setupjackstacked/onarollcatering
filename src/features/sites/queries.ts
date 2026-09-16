import "server-only";

import { cache } from "react";
import type { OrgContext } from "@/lib/auth/context";
import { pageParams, str } from "@/lib/pagination";
import { isoDateOffset } from "@/lib/dates";
import type { SiteStatus, SiteType } from "@/lib/supabase/types";

const LIST = "id, name, site_type, status, postcode, address, client_id, clients(name), oar_manager_id, site_manager_name";

export async function listSites(ctx: OrgContext, sp: Record<string, string | string[] | undefined>) {
  const { from, to, page, size } = pageParams(sp);
  const q = str(sp.q), status = str(sp.status), type = str(sp.type), mine = str(sp.mine);
  let query = ctx.supabase.from("sites").select(LIST, { count: "exact" })
    .eq("organisation_id", ctx.organisation.id).is("archived_at", null).order("name").range(from, to);
  if (q) query = query.or(`name.ilike.%${q}%,postcode.ilike.%${q}%,site_manager_name.ilike.%${q}%`);
  if (status) query = query.eq("status", status as SiteStatus);
  else query = query.neq("status", "closed");
  if (type) query = query.eq("site_type", type as SiteType);
  if (mine === "1") query = query.eq("oar_manager_id", ctx.user.id);
  const { data, count } = await query;
  return { rows: data ?? [], total: count ?? 0, page, size };
}

export const getSite = cache(async (ctx: OrgContext, id: string) => {
  const { data } = await ctx.supabase.from("sites")
    .select("*, clients(id, name), client_contacts(first_name, last_name, email, mobile, phone)")
    .eq("id", id).maybeSingle();
  return data;
});

/** Everyone assigned to the site, with their employee record where they have one. */
export async function listSiteAssignments(ctx: OrgContext, siteId: string) {
  const { data } = await ctx.supabase.from("site_assignments")
    .select("*, employees(id, first_name, last_name, employee_number, role_key, status, phone, email)")
    .eq("site_id", siteId).order("role").order("created_at");
  return data ?? [];
}

export async function siteCounts(ctx: OrgContext, id: string) {
  const [staff, docs, projects, openLeave] = await Promise.all([
    ctx.supabase.from("site_assignments").select("id", { count: "exact", head: true }).eq("site_id", id),
    ctx.supabase.from("documents").select("id", { count: "exact", head: true }).eq("entity_type", "site").eq("entity_id", id).is("archived_at", null),
    ctx.supabase.from("projects").select("id", { count: "exact", head: true }).eq("site_id", id).is("archived_at", null),
    ctx.supabase.from("timesheets").select("id", { count: "exact", head: true }).eq("site_id", id).eq("status", "submitted"),
  ]);
  return { staff: staff.count ?? 0, documents: docs.count ?? 0, projects: projects.count ?? 0, pendingTimesheets: openLeave.count ?? 0 };
}

/** Sites the signed-in user may pick from — all of them for admins, theirs for a manager. */
export const listSiteOptionsForUser = cache(async (ctx: OrgContext) => {
  const { data } = await ctx.supabase.from("sites").select("id, name, status")
    .eq("organisation_id", ctx.organisation.id).is("archived_at", null).neq("status", "closed").order("name").limit(500);
  return (data ?? []).map((s) => ({ value: s.id, label: s.name }));
});

/** Who is on shift at this site today, and who logged hours — the site day view. */
export async function siteToday(ctx: OrgContext, siteId: string) {
  const today = isoDateOffset(0);
  const [shifts, submitted] = await Promise.all([
    ctx.supabase.from("shifts").select("id, employee_id, start_time, end_time, hours, status").eq("site_id", siteId).eq("shift_date", today).neq("status", "cancelled"),
    ctx.supabase.from("timesheets").select("id, employee_id, hours, status").eq("site_id", siteId).eq("work_date", today),
  ]);
  return { shifts: shifts.data ?? [], timesheets: submitted.data ?? [] };
}

/** Sites the user manages — used for dashboards and "my sites" filters. */
export async function myManagedSites(ctx: OrgContext) {
  if (ctx.can("org.manage")) {
    const { data } = await ctx.supabase.from("sites").select("id, name").eq("organisation_id", ctx.organisation.id).is("archived_at", null).neq("status", "closed").order("name");
    return data ?? [];
  }
  const { data } = await ctx.supabase.from("site_assignments").select("site_id, sites(id, name)").eq("user_id", ctx.user.id).eq("role", "manager");
  const owned = await ctx.supabase.from("sites").select("id, name").eq("oar_manager_id", ctx.user.id).is("archived_at", null);
  const map = new Map<string, { id: string; name: string }>();
  for (const r of data ?? []) {
    const s = r.sites as unknown as { id: string; name: string } | null;
    if (s) map.set(s.id, s);
  }
  for (const s of owned.data ?? []) map.set(s.id, s);
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
