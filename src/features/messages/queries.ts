import "server-only";

import { cache } from "react";
import type { OrgContext } from "@/lib/auth/context";

export type ConversationRow = {
  id: string; kind: "direct" | "site" | "broadcast"; subject: string | null;
  site_id: string | null; site_name: string | null;
  last_message_at: string; last_message_preview: string | null;
  unread: number; other_user_id: string | null;
};

export const myConversations = cache(async (ctx: OrgContext) => {
  const { data } = await ctx.supabase.rpc("my_conversations");
  return (data ?? []) as unknown as ConversationRow[];
});

export const myUnreadMessages = cache(async (ctx: OrgContext) => {
  const { data } = await ctx.supabase.rpc("my_unread_messages");
  return Number(data ?? 0);
});

export async function getConversation(ctx: OrgContext, id: string) {
  const { data } = await ctx.supabase.from("conversations").select("*, sites(id, name)").eq("id", id).maybeSingle();
  return data;
}

export async function listMessages(ctx: OrgContext, conversationId: string, limit = 200) {
  const { data } = await ctx.supabase.from("messages")
    .select("id, body, sender_id, document_id, created_at, documents(id, name, mime_type)")
    .eq("conversation_id", conversationId).order("created_at").limit(limit);
  return data ?? [];
}

export async function listParticipants(ctx: OrgContext, conversationId: string) {
  const { data } = await ctx.supabase.from("conversation_participants")
    .select("user_id, last_read_at, muted").eq("conversation_id", conversationId);
  return data ?? [];
}
