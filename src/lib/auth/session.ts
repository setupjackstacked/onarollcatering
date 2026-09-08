import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { OrganisationRole } from "@/lib/supabase/types";

export type SessionUser = {
  id: string;
  email: string | null;
};

export type Membership = {
  organisationId: string;
  organisationName: string;
  role: OrganisationRole;
};

/** Current authenticated user, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
});

/**
 * The user's organisation memberships. Phase 0 assumes one active
 * organisation per user; the model supports many.
 */
export const getMemberships = cache(async (): Promise<Membership[]> => {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("organisation_members")
    .select("organisation_id, role, organisations(name)")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null);
  if (error || !data) return [];
  return data.map((row) => ({
    organisationId: row.organisation_id,
    organisationName:
      (row.organisations as unknown as { name: string } | null)?.name ?? "Organisation",
    role: row.role,
  }));
});

/** Redirects to login when unauthenticated. Use in dashboard/staff layouts. */
export async function requireUser(returnTo = "/dashboard"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/dashboard/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}
