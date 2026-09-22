"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/context";
import { parseForm, type FormState } from "@/lib/forms";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { mintAuthLink } from "@/lib/auth/links";
import { sendMail } from "@/lib/email/resend";
import { employeeWelcome } from "@/lib/email/templates";
import { roleLabel } from "@/lib/auth/roles";
import { serverEnv } from "@/lib/env";
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

  const { RESEND_API_KEY } = serverEnv();
  if (!RESEND_API_KEY) {
    return { error: "Email isn’t configured yet, so the invitation can’t be sent. Set it up in Settings → Email first." };
  }

  // Mint the link ourselves and send our own email. Supabase will happily send
  // its default "You've been invited" template from a supabase.co address, and
  // that is not what someone joining this business should receive.
  let minted = await mintAuthLink("invite", p.data.email);
  if (!minted) minted = await mintAuthLink("recovery", p.data.email);
  if (!minted) {
    logger.error("team.invite_failed", { email: p.data.email });
    return { error: "Couldn’t create the login. Check the email address and try again." };
  }
  const userId: string = minted.userId;

  const mail = employeeWelcome({
    firstName: (p.data.full_name || p.data.email).split(" ")[0] ?? p.data.email,
    actionLink: minted.url,
    roleLabel: roleLabel(p.data.role),
    isStaff: p.data.role === "staff",
  });
  const sent = await sendMail({ to: p.data.email, ...mail });
  if (!sent.ok) return { error: "The login was created but the email didn’t send. Check Settings → Email." };

  // Ensure profile name (trigger creates the row; name may be missing for existing users)
  if (p.data.full_name) {
    const admin = createSupabaseAdminClient();
    await admin.from("profiles").update({ full_name: p.data.full_name }).eq("id", userId).is("full_name", null);
  }

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
