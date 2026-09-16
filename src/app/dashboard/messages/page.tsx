import Link from "next/link";
import { requireOrgContext } from "@/lib/auth/context";
import { myConversations } from "@/features/messages/queries";
import { memberMap, memberLabel } from "@/features/shared/members";
import { PageHeader, Panel, EmptyState, StatusBadge } from "@/components/dashboard/primitives";
import { ActionLink } from "@/components/dashboard/entity";
import { RelativeTime } from "@/components/dashboard/relative-time";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const ctx = await requireOrgContext("/dashboard/messages");
  const [conversations, mmap] = await Promise.all([myConversations(ctx), memberMap(ctx)]);
  const canBroadcast = ctx.can("org.manage");

  const title = (c: (typeof conversations)[number]) => {
    if (c.kind === "direct") return c.other_user_id ? memberLabel(mmap.get(c.other_user_id)) : "Direct message";
    if (c.kind === "site") return `${c.site_name ?? "Site"} — team`;
    return c.subject ?? "Announcement";
  };

  return (
    <>
      <PageHeader eyebrow="Communication" title="Messages"
        description="Work conversations live here rather than on personal phones, so they stay with the business."
        actions={<>
          <ActionLink href="/dashboard/messages/new" variant="copper">New message</ActionLink>
          {canBroadcast ? <ActionLink href="/dashboard/messages/new?broadcast=1">Announcement</ActionLink> : null}
        </>} />

      {conversations.length ? (
        <Panel title={`Conversations (${conversations.length})`}>
          <ul className="divide-y divide-graphite/10">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link href={`/dashboard/messages/${c.id}`} className="flex items-start justify-between gap-3 py-3 hover:bg-graphite/[0.03]">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{title(c)}</span>
                      {c.kind === "broadcast" ? <StatusBadge label="Announcement" tone="copper" /> : null}
                      {c.kind === "site" ? <StatusBadge label="Site team" tone="blue" /> : null}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted-light">{c.last_message_preview ?? "No messages yet"}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs text-muted-light"><RelativeTime value={c.last_message_at} /></span>
                    {Number(c.unread) > 0 ? <span className="rounded-full bg-copper px-2 py-0.5 text-xs font-medium text-ivory">{c.unread}</span> : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <EmptyState title="No conversations yet"
          description="Message a colleague directly, open a site's team thread, or send an announcement to everyone."
          action={{ label: "New message", href: "/dashboard/messages/new" }} />
      )}
    </>
  );
}
