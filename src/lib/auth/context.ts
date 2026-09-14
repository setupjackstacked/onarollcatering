import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getMemberships, type SessionUser, type Membership } from "@/lib/auth/session";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OrgContext = {
  user: SessionUser;
  organisation: { id: string; name: string };
  role: Membership["role"];
  can: (permission: Permission) => boolean;
  /** RLS-scoped Supabase client for this request. */
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
};

/**
 * Resolves the signed-in user's active organisation and role.
 * - Unauthenticated → redirect to login.
 * - Authenticated but no membership → redirect to /dashboard/no-access (rendered honestly).
 * Phase 0 assumption: one organisation per user; first accepted membership wins.
 */
export const requireOrgContext = cache(async (next = "/dashboard"): Promise<OrgContext> => {
  const user = await getCurrentUser();
  if (!user) redirect(`/dashboard/login?next=${encodeURIComponent(next)}`);
  const memberships = await getMemberships();
  const membership = memberships[0];
  if (!membership) redirect("/dashboard/no-access");
  const supabase = await createSupabaseServerClient();
  return {
    user,
    organisation: { id: membership.organisationId, name: membership.organisationName },
    role: membership.role,
    can: (permission) => hasPermission(membership.role, permission),
    supabase,
  };
});

/** Throws (→ error boundary) when the role lacks a permission. Use in server actions. */
export async function requirePermission(permission: Permission) {
  const ctx = await requireOrgContext();
  if (!ctx.can(permission)) {
    throw new Error(`Forbidden: ${permission}`);
  }
  return ctx;
}
