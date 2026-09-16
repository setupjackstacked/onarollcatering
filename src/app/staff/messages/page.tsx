import Link from "next/link";
import { requireStaff } from "@/features/staff/queries";
import { myConversations } from "@/features/messages/queries";
import { messageMyManager } from "@/features/messages/actions";
import { memberMap, memberLabel } from "@/features/shared/members";
import { RedirectingAction } from "@/components/dashboard/redirecting-action";
import { RelativeTime } from "@/components/dashboard/relative-time";

export const metadata = { title: "Messages" };

export default async function StaffMessagesPage() {
  const { ctx } = await requireStaff("/staff/messages");
  const [conversations, mmap] = await Promise.all([myConversations(ctx), memberMap(ctx)]);

  const title = (c: (typeof conversations)[number]) => {
    if (c.kind === "direct") return c.other_user_id ? memberLabel(mmap.get(c.other_user_id)) : "Message";
    if (c.kind === "site") return `${c.site_name ?? "Site"} team`;
    return c.subject ?? "Announcement";
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display display-sm">Messages</h1>
      <RedirectingAction action={messageMyManager} label="Message my manager" variant="copper" />

      {conversations.length ? (
        <ul className="divide-y divide-graphite/10 rounded-lg border border-graphite/10 bg-white/50">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link href={`/staff/messages/${c.id}`} className="flex items-start justify-between gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{title(c)}</span>
                  <span className="block truncate text-sm text-muted-light">{c.last_message_preview ?? "No messages yet"}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs text-muted-light"><RelativeTime value={c.last_message_at} /></span>
                  {Number(c.unread) > 0 ? <span className="rounded-full bg-copper px-2 py-0.5 text-xs font-medium text-ivory">{c.unread}</span> : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-graphite/20 px-4 py-8 text-center text-sm text-muted-light">
          No messages yet. Use the button above to reach your manager.
        </p>
      )}
    </div>
  );
}
