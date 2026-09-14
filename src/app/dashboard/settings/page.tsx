import { requireOrgContext } from "@/lib/auth/context";
import { PageHeader, Panel, StatusBadge } from "@/components/dashboard/primitives";

export const metadata = { title: "Settings" };

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner", administrator: "Administrator", finance: "Finance", project_manager: "Project Manager", staff: "Staff", read_only: "Read only",
};

/** Phase 3: read-only organisation + team view. Invites and role changes come with Phase 4. */
export default async function SettingsPage() {
  const ctx = await requireOrgContext("/dashboard/settings");
  const { data: members } = await ctx.supabase
    .from("organisation_members")
    .select("id, role, accepted_at, user_id, profiles:profiles!organisation_members_profile_fk(full_name, email)")
    .eq("organisation_id", ctx.organisation.id)
    .order("created_at");

  return (
    <>
      <PageHeader title="Settings" description="Organisation and team. Editing, invitations and role changes arrive in Phase 4." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Organisation">
          <dl className="grid grid-cols-3 gap-y-3 text-sm">
            <dt className="text-muted-light">Name</dt><dd className="col-span-2">{ctx.organisation.name}</dd>
            <dt className="text-muted-light">Your role</dt><dd className="col-span-2">{ROLE_LABEL[ctx.role]}</dd>
            <dt className="text-muted-light">Signed in as</dt><dd className="col-span-2">{ctx.user.email}</dd>
          </dl>
        </Panel>
        <Panel title="Team">
          <ul className="divide-y divide-graphite/10">
            {(members ?? []).map((m) => {
              const p = m.profiles as unknown as { full_name: string | null; email: string | null } | null;
              return (
                <li key={m.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p?.full_name ?? p?.email ?? m.user_id}</span>
                    {p?.full_name && p?.email ? <span className="block truncate text-xs text-muted-light">{p.email}</span> : null}
                  </span>
                  <StatusBadge label={ROLE_LABEL[m.role] ?? m.role} tone={m.role === "owner" ? "copper" : "grey"} />
                  {!m.accepted_at ? <StatusBadge label="Invited" tone="amber" /> : null}
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </>
  );
}
