"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrgContext } from "@/lib/auth/context";
import { parseForm, nullable, type FormState } from "@/lib/forms";
import { requiredText, optionalUuid } from "@/lib/forms/fields";
import { logger } from "@/lib/logger";

const messageSchema = z.object({ body: requiredText(1, 5000, "Write something first") });
const broadcastSchema = z.object({
  subject: requiredText(2, 160, "Give the announcement a subject"),
  body: requiredText(1, 5000, "Write the announcement"),
  site_id: optionalUuid,
});

/** Posts into a thread the caller is already part of — RLS enforces that. */
export async function sendMessage(conversationId: string, _: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireOrgContext();
  const p = parseForm(messageSchema, formData);
  if (!p.ok) return p.state;
  const { error } = await ctx.supabase.from("messages").insert({
    organisation_id: ctx.organisation.id, conversation_id: conversationId,
    sender_id: ctx.user.id, body: p.data.body, document_id: nullable(String(formData.get("document_id") ?? "")),
  });
  if (error) {
    if (error.code === "42501") return { error: "You’re not part of this conversation." };
    logger.error("messages.send_failed", { message: error.message });
    return { error: "Couldn’t send. Please try again." };
  }
  revalidatePath(`/dashboard/messages/${conversationId}`);
  revalidatePath(`/staff/messages/${conversationId}`);
  revalidatePath("/dashboard/messages");
  revalidatePath("/staff/messages");
  return { success: "Sent." };
}

export async function startDirect(otherUserId: string) {
  const ctx = await requireOrgContext();
  const { data, error } = await ctx.supabase.rpc("start_direct_conversation", { p_other_user: otherUserId });
  if (error) return { error: error.message.replace(/^[^:]*: /, "") };
  return { redirectTo: `/dashboard/messages/${data}` };
}

export async function openSiteConversation(siteId: string) {
  const ctx = await requireOrgContext();
  const { data, error } = await ctx.supabase.rpc("site_conversation", { p_site_id: siteId });
  if (error) return { error: error.message.replace(/^[^:]*: /, "") };
  return { redirectTo: `/dashboard/messages/${data}` };
}

export async function sendBroadcast(_: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireOrgContext();
  const p = parseForm(broadcastSchema, formData);
  if (!p.ok) return p.state;
  const { data, error } = await ctx.supabase.rpc("start_broadcast", {
    p_subject: p.data.subject, p_body: p.data.body, p_site_id: nullable(p.data.site_id) ?? undefined,
  });
  if (error) return { error: error.message.replace(/^[^:]*: /, "") };
  revalidatePath("/dashboard/messages");
  return { success: "Announcement sent.", redirectTo: `/dashboard/messages/${data}` };
}

export async function markRead(conversationId: string) {
  const ctx = await requireOrgContext();
  await ctx.supabase.rpc("mark_conversation_read", { p_conversation_id: conversationId });
}

/** Starts (or reopens) a thread with the person's manager — the staff shortcut. */
export async function messageMyManager() {
  const ctx = await requireOrgContext();
  const { data: employee } = await ctx.supabase.from("employees").select("id, primary_site_id").eq("user_id", ctx.user.id).maybeSingle();
  if (!employee?.primary_site_id) return { error: "You don’t have a base site yet — ask an administrator to assign you to one." };
  const { data: site } = await ctx.supabase.from("sites").select("oar_manager_id").eq("id", employee.primary_site_id).maybeSingle();
  if (!site?.oar_manager_id) return { error: "Your site has no manager assigned yet." };
  const { data, error } = await ctx.supabase.rpc("start_direct_conversation", { p_other_user: site.oar_manager_id });
  if (error) return { error: error.message.replace(/^[^:]*: /, "") };
  return { redirectTo: `/staff/messages/${data}` };
}
