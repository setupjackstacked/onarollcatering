"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/context";
import { parseForm, type FormState } from "@/lib/forms";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { publicEnv, serverEnv } from "@/lib/env";
import { sendMail } from "@/lib/email/resend";
import { employeeWelcome, emailDiagnostic } from "@/lib/email/templates";
import { roleLabel, siteRoleFor } from "@/lib/auth/roles";
import { logger } from "@/lib/logger";
import type { OrganisationRole } from "@/lib/supabase/types";

const ROLES = ["owner", "administrator", "finance", "project_manager", "staff", "read_only"] as const;

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  role: z.enum(ROLES),
});

const REDIRECT = `${publicEnv.NEXT_PUBLIC_SITE_URL}/dashboard/auth/callback?next=/dashboard/reset-password`;

/**
 * Give an employee a login and email them a welcome message.
 *
 * The employee list came from the business without email addresses, so people
 * exist in the system before they can sign in. An admin adds the address here
 * and this does the rest in one go:
 *
 *   1. creates the auth user and mints a one-time invite link (service role),
 *   2. sends OUR branded email through Resend rather than Supabase's default,
 *      so the message looks like the business and the copy is ours,
 *   3. links employee → user, organisation membership and site roster via a
 *      single security-definer function, so a failure can't leave someone
 *      half-connected.
 *
 * The email is sent before the account is linked on purpose: if email is
 * misconfigured we say so plainly instead of creating an account nobody can
 * reach. Owner/administrator only, checked here and again in the database.
 */
export async function inviteEmployee(employeeId: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requirePermission("workforce.write");
  const p = parseForm(inviteSchema, formData);
  if (!p.ok) return p.state;
  const { email, role } = p.data;
  if (role === "owner" && ctx.role !== "owner") return { error: "Only an owner can grant owner access." };

  const { data: employee } = await ctx.supabase
    .from("employees")
    .select("id, first_name, last_name, user_id, primary_site_id, sites:sites!employees_primary_site_id_fkey(name)")
    .eq("id", employeeId)
    .maybeSingle();
  if (!employee) return { error: "That employee record no longer exists." };
  if (employee.user_id) return { error: "This employee already has a login. Use “Resend” to send them another password link." };

  const { RESEND_API_KEY } = serverEnv();
  if (!RESEND_API_KEY) {
    return { error: "Email isn’t configured yet, so the welcome message can’t be sent. Set it up in Settings → Email first." };
  }

  const admin = createSupabaseAdminClient();

  // Mint the account and the one-time link in a single call. generateLink
  // creates the user for type 'invite' but sends nothing itself.
  let actionLink: string | null = null;
  let userId: string | null = null;
  const invite = await admin.auth.admin.generateLink({ type: "invite", email, options: { redirectTo: REDIRECT } });
  if (invite.data?.properties?.action_link && invite.data.user) {
    actionLink = invite.data.properties.action_link;
    userId = invite.data.user.id;
  } else if (invite.error && /already|exists|registered/i.test(invite.error.message)) {
    // They already have an account from somewhere else — send a password link
    // instead of failing, and link the existing user to this employee record.
    const recovery = await admin.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo: REDIRECT } });
    if (!recovery.data?.properties?.action_link || !recovery.data.user) {
      logger.error("employee.invite_link_failed", { reason: recovery.error?.message });
      return { error: "That address already has an account, but a password link couldn’t be created. Try again." };
    }
    actionLink = recovery.data.properties.action_link;
    userId = recovery.data.user.id;
  } else {
    logger.error("employee.invite_link_failed", { reason: invite.error?.message });
    return { error: "Couldn’t create the login. Check the email address and try again." };
  }

  const siteName = (employee.sites as unknown as { name: string } | null)?.name ?? null;
  const mail = employeeWelcome({
    firstName: employee.first_name,
    actionLink,
    roleLabel: roleLabel(role),
    siteName,
    isStaff: role === "staff",
  });
  const sent = await sendMail({ to: email, ...mail });
  if (!sent.ok) {
    return { error: "The login was created but the email didn’t send. Check Settings → Email, then use “Resend”." };
  }

  const { error } = await ctx.supabase.rpc("link_employee_account", {
    p_employee_id: employeeId,
    p_user_id: userId,
    p_role: role as OrganisationRole,
    p_site_role: siteRoleFor(role as OrganisationRole),
  });
  if (error) {
    logger.error("employee.link_failed", { code: error.code, message: error.message });
    return { error: error.code === "42501" ? "You don’t have permission to do that." : "The email went out but the account couldn’t be linked. Tell your administrator." };
  }

  // Keep the address on the employee record so the list shows it.
  await ctx.supabase.from("employees").update({ email }).eq("id", employeeId);

  logger.info("employee.invited", { employeeId, role });
  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${employeeId}`);
  return { success: `Welcome email sent to ${email}.` };
}

/**
 * Send another password link to someone who already has a login — they never
 * opened the first one, or they've forgotten the password and asked an admin.
 */
export async function resendEmployeeInvite(employeeId: string): Promise<FormState> {
  const ctx = await requirePermission("workforce.write");
  const { data: employee } = await ctx.supabase
    .from("employees")
    .select("id, first_name, email, user_id, primary_site_id, sites:sites!employees_primary_site_id_fkey(name)")
    .eq("id", employeeId)
    .maybeSingle();
  if (!employee?.email) return { error: "Add an email address first." };

  const { data: membership } = await ctx.supabase
    .from("organisation_members")
    .select("role")
    .eq("organisation_id", ctx.organisation.id)
    .eq("user_id", employee.user_id ?? "")
    .maybeSingle();
  const role = (membership?.role ?? "staff") as OrganisationRole;

  const admin = createSupabaseAdminClient();
  const type = employee.user_id ? "recovery" : "invite";
  const link = await admin.auth.admin.generateLink({ type, email: employee.email, options: { redirectTo: REDIRECT } });
  if (!link.data?.properties?.action_link) {
    logger.error("employee.resend_failed", { reason: link.error?.message });
    return { error: "Couldn’t create a new link. Try again." };
  }

  const mail = employeeWelcome({
    firstName: employee.first_name,
    actionLink: link.data.properties.action_link,
    roleLabel: roleLabel(role),
    siteName: (employee.sites as unknown as { name: string } | null)?.name ?? null,
    isStaff: role === "staff",
  });
  const sent = await sendMail({ to: employee.email, ...mail });
  if (!sent.ok) return { error: "The email didn’t send. Check Settings → Email." };

  await ctx.supabase.rpc("record_employee_invite", { p_employee_id: employeeId, p_email: employee.email });
  revalidatePath(`/dashboard/employees/${employeeId}`);
  return { success: `Sent again to ${employee.email}.` };
}

/**
 * Prove the email pipeline works end to end. Sends to whoever asked, so a
 * misconfigured address can't be used to mail a stranger.
 */
export async function sendTestEmail(): Promise<FormState> {
  const ctx = await requirePermission("org.manage");
  const { RESEND_API_KEY, EMAIL_FROM } = serverEnv();
  if (!RESEND_API_KEY) return { error: "RESEND_API_KEY isn’t set. Add it in Vercel and redeploy." };
  if (!ctx.user.email) return { error: "Your account has no email address." };

  const mail = emailDiagnostic({ sentBy: ctx.user.email, from: EMAIL_FROM, siteUrl: publicEnv.NEXT_PUBLIC_SITE_URL });
  const sent = await sendMail({ to: ctx.user.email, ...mail });
  if (!sent.ok) {
    return { error: "Resend rejected the message. The usual cause is that the sending domain isn’t verified yet." };
  }
  return { success: `Sent to ${ctx.user.email} (Resend id ${sent.id}). If it doesn’t arrive within a minute, check spam.` };
}
