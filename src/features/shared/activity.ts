import "server-only";

import type { OrgContext } from "@/lib/auth/context";
import { memberMap } from "./members";
import type { ActivityRow } from "@/components/dashboard/activity-timeline";
import type { NoteRow } from "@/components/dashboard/notes-panel";

export async function listActivity(ctx: OrgContext, entityType: string, entityId: string, limit = 50): Promise<ActivityRow[]> {
  const [{ data }, members] = await Promise.all([
    ctx.supabase
      .from("activity_logs")
      .select("id, action, created_at, metadata, user_id")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(limit),
    memberMap(ctx),
  ]);
  return (data ?? []).map((a) => ({ id: a.id, action: a.action, created_at: a.created_at, metadata: (a.metadata ?? {}) as Record<string, unknown>, user: a.user_id ? members.get(a.user_id) ?? null : null }));
}

export async function listNotes(ctx: OrgContext, entityType: string, entityId: string): Promise<NoteRow[]> {
  const [{ data }, members] = await Promise.all([
    ctx.supabase.from("notes").select("id, body, created_at, created_by").eq("entity_type", entityType).eq("entity_id", entityId).order("pinned", { ascending: false }).order("created_at", { ascending: false }),
    memberMap(ctx),
  ]);
  return (data ?? []).map((n) => ({ ...n, author: n.created_by ? members.get(n.created_by) ?? null : null }));
}

/** Manual audit entry for mutations that triggers don't cover. */
export async function logActivity(ctx: OrgContext, entityType: string, entityId: string, action: string, metadata: Record<string, unknown> = {}) {
  await ctx.supabase.rpc("log_activity", { org: ctx.organisation.id, entity_type: entityType, entity_id: entityId, action, metadata: metadata as never });
}
