import { requireOrgContext } from "@/lib/auth/context";
import { myManagedSites } from "@/features/sites/queries";
import { startDirect, openSiteConversation } from "@/features/messages/actions";
import { listMembers, memberLabel } from "@/features/shared/members";
import { roleLabel } from "@/lib/auth/roles";
import { EntityHeader } from "@/components/dashboard/entity";
import { Panel } from "@/components/dashboard/primitives";
import { RedirectingAction } from "@/components/dashboard/redirecting-action";
import { BroadcastForm } from "@/components/dashboard/forms/message-forms";
import { str } from "@/lib/pagination";

export const metadata = { title: "New message" };

export default async function NewMessagePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/messages/new");
  const sp = await searchParams;
  const broadcast = str(sp.broadcast) === "1" && ctx.can("org.manage");
  const [members, sites] = await Promise.all([listMembers(ctx), myManagedSites(ctx)]);
  const people = members.filter((m) => m.user_id !== ctx.user.id);

  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: "/dashboard/messages", label: "Messages" }} eyebrow="Communication"
        title={broadcast ? "Send an announcement" : "New message"} />

      {broadcast ? (
        <Panel title="Announcement">
          <p className="mb-4 text-sm text-muted-light">Everyone you send this to gets a notification. They can reply in the thread.</p>
          <BroadcastForm sites={sites.map((s) => ({ value: s.id, label: s.name }))} />
        </Panel>
      ) : (
        <div className="space-y-6">
          <Panel title="Message someone">
            {people.length ? (
              <ul className="divide-y divide-graphite/10">
                {people.map((m) => (
                  <li key={m.user_id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span>
                      <span className="block text-sm font-medium">{memberLabel(m)}</span>
                      <span className="block text-xs text-muted-light">{roleLabel(m.role)}</span>
                    </span>
                    <RedirectingAction action={startDirect.bind(null, m.user_id)} label="Message" />
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-light">Nobody else has a login yet.</p>}
          </Panel>

          {sites.length ? (
            <Panel title="Message a site team">
              <p className="mb-4 text-sm text-muted-light">Everyone assigned to the site sees it, including anyone added later.</p>
              <ul className="divide-y divide-graphite/10">
                {sites.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="text-sm font-medium">{s.name}</span>
                    <RedirectingAction action={openSiteConversation.bind(null, s.id)} label="Open team thread" />
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      )}
    </div>
  );
}
