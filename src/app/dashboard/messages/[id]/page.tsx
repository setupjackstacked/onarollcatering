import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getConversation, listMessages, listParticipants } from "@/features/messages/queries";
import { markRead } from "@/features/messages/actions";
import { memberMap, memberLabel } from "@/features/shared/members";
import { EntityHeader } from "@/components/dashboard/entity";
import { Panel, StatusBadge } from "@/components/dashboard/primitives";
import { MessageThread } from "@/components/dashboard/message-thread";
import { SendMessageForm } from "@/components/dashboard/forms/message-forms";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/messages/${id}`);
  const conversation = await getConversation(ctx, id);
  if (!conversation) notFound();
  const [messages, participants, mmap] = await Promise.all([listMessages(ctx, id), listParticipants(ctx, id), memberMap(ctx)]);
  await markRead(id);

  const site = conversation.sites as unknown as { id: string; name: string } | null;
  const others = participants.filter((p) => p.user_id !== ctx.user.id);
  const heading = conversation.kind === "direct"
    ? memberLabel(mmap.get(others[0]?.user_id ?? ""))
    : conversation.subject ?? site?.name ?? "Conversation";

  return (
    <div className="mx-auto max-w-3xl">
      <EntityHeader
        back={{ href: "/dashboard/messages", label: "Messages" }}
        eyebrow={conversation.kind === "site" ? "Site team" : conversation.kind === "broadcast" ? "Announcement" : "Direct message"}
        title={heading}
        badge={conversation.kind === "broadcast" ? <StatusBadge label="Announcement" tone="copper" /> : null}
        meta={conversation.kind === "direct"
          ? null
          : <span>{participants.length} {participants.length === 1 ? "person" : "people"}{site ? <> · <Link href={`/dashboard/sites/${site.id}`} className="underline">{site.name}</Link></> : null}</span>}
      />

      <div className="space-y-6">
        <MessageThread messages={messages} currentUserId={ctx.user.id} nameFor={(uid) => memberLabel(mmap.get(uid ?? ""))} />
        <Panel title="Reply"><SendMessageForm conversationId={id} /></Panel>
        {conversation.kind !== "direct" ? (
          <Panel title="Who's in this conversation">
            <p className="text-sm text-muted-light">{participants.map((p) => memberLabel(mmap.get(p.user_id))).join(", ")}</p>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
