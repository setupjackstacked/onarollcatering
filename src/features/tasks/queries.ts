import "server-only";

import type { OrgContext } from "@/lib/auth/context";
import { pageParams, str } from "@/lib/pagination";

const SELECT = "id, title, status, priority, due_date, assignee_user_id, project_id, projects(name, project_number), completed_at, created_at";

export async function listTasks(ctx: OrgContext, sp: Record<string, string | string[] | undefined>, projectId?: string) {
  const { from, to, page, size } = pageParams(sp, 50);
  const status = str(sp.status), assignee = str(sp.assignee), q = str(sp.q);
  let query = ctx.supabase.from("tasks").select(SELECT, { count: "exact" }).eq("organisation_id", ctx.organisation.id).order("status").order("due_date", { ascending: true, nullsFirst: false }).order("priority", { ascending: false }).range(from, to);
  if (projectId) query = query.eq("project_id", projectId);
  if (status === "open") query = query.neq("status", "complete");
  else if (status) query = query.eq("status", status as never);
  else if (!projectId) query = query.neq("status", "complete");
  if (assignee === "me") query = query.eq("assignee_user_id", ctx.user.id);
  else if (assignee) query = query.eq("assignee_user_id", assignee);
  if (q) query = query.ilike("title", `%${q}%`);
  const { data, count } = await query;
  return { rows: data ?? [], total: count ?? 0, page, size };
}

export async function getTask(ctx: OrgContext, id: string) {
  const { data } = await ctx.supabase.from("tasks").select("*").eq("id", id).maybeSingle();
  return data;
}
