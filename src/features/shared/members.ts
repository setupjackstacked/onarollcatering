import "server-only";

import { cache } from "react";
import type { OrgContext } from "@/lib/auth/context";

export type MemberOption = { user_id: string; full_name: string | null; email: string | null; role: string };

/** Org members with profile names — for assignee / PM pickers and activity attribution. */
export const listMembers = cache(async (ctx: OrgContext): Promise<MemberOption[]> => {
  const { data } = await ctx.supabase
    .from("organisation_member_profiles")
    .select("user_id, full_name, email, role")
    .eq("organisation_id", ctx.organisation.id)
    .not("accepted_at", "is", null)
    .order("full_name");
  return (data ?? []).map((m) => ({ user_id: m.user_id!, full_name: m.full_name, email: m.email, role: m.role! }));
});

export function memberLabel(m: { full_name: string | null; email: string | null } | undefined | null) {
  return m?.full_name ?? m?.email ?? "—";
}

export async function memberMap(ctx: OrgContext) {
  const members = await listMembers(ctx);
  return new Map(members.map((m) => [m.user_id, m]));
}

export function memberOptions(members: MemberOption[]) {
  return members.map((m) => ({ value: m.user_id, label: memberLabel(m) }));
}
