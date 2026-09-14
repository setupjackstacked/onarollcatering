import "server-only";

import type { OrgContext } from "@/lib/auth/context";
import { pageParams, str } from "@/lib/pagination";
import { ACTIVE_PROJECT_STATUSES } from "@/lib/domain/statuses";
import type { ProjectStatus } from "@/lib/supabase/types";

export async function listProjects(ctx: OrgContext, sp: Record<string, string | string[] | undefined>) {
  const { from, to, page, size } = pageParams(sp);
  const q = str(sp.q), status = str(sp.status), pm = str(sp.pm), client = str(sp.client);
  let query = ctx.supabase
    .from("projects")
    .select("id, project_number, name, status, client_id, clients(name), project_manager_id, start_date, end_date, contract_value, estimated_cost, updated_at", { count: "exact" })
    .eq("organisation_id", ctx.organisation.id)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .range(from, to);
  if (q) query = query.or(`name.ilike.%${q}%,project_number.ilike.%${q}%`);
  if (status === "active") query = query.in("status", ACTIVE_PROJECT_STATUSES);
  else if (status) query = query.eq("status", status as ProjectStatus);
  if (pm === "me") query = query.eq("project_manager_id", ctx.user.id);
  else if (pm) query = query.eq("project_manager_id", pm);
  if (client) query = query.eq("client_id", client);
  const { data, count } = await query;
  return { rows: data ?? [], total: count ?? 0, page, size };
}

export async function getProject(ctx: OrgContext, id: string) {
  const { data } = await ctx.supabase.from("projects").select("*, clients(id, name, payment_terms_days), sites(id, name, postcode, address)").eq("id", id).maybeSingle();
  return data;
}

export async function projectCounts(ctx: OrgContext, id: string) {
  const [tasks, docs] = await Promise.all([
    ctx.supabase.from("tasks").select("id", { count: "exact", head: true }).eq("project_id", id).neq("status", "complete"),
    ctx.supabase.from("documents").select("id", { count: "exact", head: true }).eq("entity_type", "project").eq("entity_id", id).is("archived_at", null),
  ]);
  return { tasks: tasks.count ?? 0, documents: docs.count ?? 0 };
}
