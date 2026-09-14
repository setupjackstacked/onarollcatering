"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/context";
import { parseForm, type FormState } from "@/lib/forms";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

const ROLES = ["owner", "administrator", "finance", "project_manager", "staff", "read_only"] as const;

const inviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(254),
  full_name: z.string().trim().max(120).optional().or(z.literal("")),
  role: z.enum(ROLES),
});

/**
 * Invite a team member: creates (or finds) the auth user via the service role,
 * sends Supabase's invite email (they set a password from the link), and adds
 * the membership. Owner/administrator only (RLS also enforces the insert).
 */
export async function inviteMember(_: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("members.invite");
  const p = parseForm(inviteSchema, formData);
  if (!p.ok) return p.state;
  if (p.data.role === "owner" && ctx.role !== "owner") return { error: "Only an owner can add another owner." };

  const admin = createSupabaseAdminClient();
  let userId: string | null = null;

  const invite = await admin.auth.admin.inviteUserByEmail(p.data.email, {
    data: { full_name: p.data.full_name || undefined },
    redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/dashboard/auth/callback?next=/dashboard/reset-password`,
  });
  if (invite.data.user) {
    userId = invite.data.user.id;
  } else if (invite.error && /already|exists|registered/i.test(invite.error.message)) {
    // Existing account — look it up and just add the membership.
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
    userId = list?.users.find((u) => u.email?.toLowerCase() === p.data.email.toLowerCase())?.id ?? null;
    if (!userId) return { error: "That email already has an account but couldn’t be found. Try again." };
  } else {
    logger.error("team.invite_failed", { reason: invite.error?.message });
    return { error: "Couldn’t send the invitation. Check the email address and try again." };
  }

  // Ensure profile name (trigger creates the row; name may be missing for existing users)
  if (p.data.full_name) await admin.from("profiles").update({ full_name: p.data.full_name }).eq("id", userId).is("full_name", null);

  const { error } = await ctx.supabase.from("organisation_members").insert({
    organisation_id: ctx.organisation.id,
    user_id: userId,
    role: p.data.role,
    invited_by: ctx.user.id,
    accepted_at: new Date().toISOString(),
  });
  if (error) {
    if (error.code === "23505") return { error: "That person is already a member." };
    return { error: error.code === "42501" ? "You don’t have permission to invite members." : "Couldn’t add the member." };
  }
  logger.info("team.invited", { email: p.data.email, role: p.data.role });
  revalidatePath("/dashboard/settings");
  return { success: `Invitation sent to ${p.data.email}.` };
}

export async function changeMemberRole(memberId: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("members.invite");
  const p = parseForm(z.object({ role: z.enum(ROLES) }), formData);
  if (!p.ok) return p.state;
  if (p.data.role === "owner" && ctx.role !== "owner") return { error: "Only an owner can grant owner." };
  const { data: target } = await ctx.supabase.from("organisation_members").select("user_id, role").eq("id", memberId).maybeSingle();
  if (!target) return { error: "Member not found." };
  if (target.user_id === ctx.user.id) return { error: "You can’t change your own role." };
  if (target.role === "owner" && ctx.role !== "owner") return { error: "Only an owner can change another owner." };
  const { error } = await ctx.supabase.from("organisation_members").update({ role: p.data.role }).eq("id", memberId);
  if (error) return { error: "Couldn’t update the role." };
  revalidatePath("/dashboard/settings");
  return { success: "Role updated." };
}

export async function removeMember(memberId: string) {
  const ctx = await requirePermission("org.manage");
  const { data: target } = await ctx.supabase.from("organisation_members").select("user_id, role").eq("id", memberId).maybeSingle();
  if (!target || target.user_id === ctx.user.id) return;
  if (ctx.role !== "owner") return; // RLS: delete is owner-only
  await ctx.supabase.from("organisation_members").delete().eq("id", memberId);
  revalidatePath("/dashboard/settings");
}
