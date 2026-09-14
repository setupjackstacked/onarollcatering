import Link from "next/link";
import { RelativeTime } from "@/components/dashboard/relative-time";
import { requireOrgContext } from "@/lib/auth/context";
import { markAllNotificationsRead, markNotificationRead } from "@/features/dashboard/notifications";
import { PageHeader, EmptyState } from "@/components/dashboard/primitives";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { supabase, user } = await requireOrgContext("/dashboard/notifications");
  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, href, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const items = data ?? [];
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Dashboard notifications only for now — email delivery comes with Phase 11."
        actions={
          unread ? (
            <form action={markAllNotificationsRead}>
              <button type="submit" className="h-10 rounded-full border border-graphite/20 px-4 text-sm hover:border-graphite">Mark all read</button>
            </form>
          ) : null
        }
      />
      {items.length ? (
        <ul className="divide-y divide-graphite/10 rounded-lg border border-graphite/10 bg-white/40">
          {items.map((n) => (
            <li key={n.id} className={cn("flex items-start gap-3 px-4 py-3", !n.read_at && "bg-copper/5")}>
              <span className={cn("mt-2 size-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-copper")} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{n.href ? <Link href={n.href} className="hover:underline">{n.title}</Link> : n.title}</p>
                {n.body ? <p className="text-sm text-muted-light">{n.body}</p> : null}
                <p className="mt-1 text-xs text-muted-light"><RelativeTime value={n.created_at} /></p>
              </div>
              {!n.read_at ? (
                <form action={markNotificationRead.bind(null, n.id)}>
                  <button type="submit" className="text-xs text-muted-light hover:text-graphite">Mark read</button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No notifications" description="Overdue invoices, expiring quotes and documents, and staffing conflicts will appear here as those modules go live." />
      )}
    </>
  );
}
