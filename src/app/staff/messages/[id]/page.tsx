import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/features/staff/queries";
import { getConversation, listMessages, listParticipants } from "@/features/messages/queries";
import { markRead } from "@/features/messages/actions";
import { memberMap, memberLabel } from "@/features/shared/members";
import { MessageThread } from "@/components/dashboard/message-thread";
import { SendMessageForm } from "@/components/dashboard/forms/message-forms";

export default async function StaffConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ctx } = await requireStaff(`/staff/messages/${id}`);
  const conversation = await getConversation(ctx, id);
  if (!conversation) notFound();
  const [messages, participants, mmap] = await Promise.all([listMessages(ctx, id), listParticipants(ctx, id), memberMap(ctx)]);
  await markRead(id);

  const site = conversation.sites as unknown as { name: string } | null;
  const others = participants.filter((p) => p.user_id !== ctx.user.id);
  const heading = conversation.kind === "direct"
    ? memberLabel(mmap.get(others[0]?.user_id ?? ""))
    : conversation.subject ?? site?.name ?? "Conversation";

  return (
    <div className="space-y-5">
      <div>
        <Link href="/staff/messages" className="text-sm underline">← Messages</Link>
        <h1 className="font-display display-sm mt-2">{heading}</h1>
        {conversation.kind !== "direct" ? <p className="mt-1 text-sm text-muted-light">{participants.length} people</p> : null}
      </div>
      <MessageThread messages={messages} currentUserId={ctx.user.id} nameFor={(uid) => memberLabel(mmap.get(uid ?? ""))} />
      <SendMessageForm conversationId={id} />
    </div>
  );
}
