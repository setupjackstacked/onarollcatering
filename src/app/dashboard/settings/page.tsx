import { requireOrgContext } from "@/lib/auth/context";
import { removeMember } from "@/features/team/actions";
import { PageHeader, Panel, StatusBadge } from "@/components/dashboard/primitives";
import { DescriptionList } from "@/components/dashboard/entity";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { InviteForm, RoleForm } from "@/components/dashboard/forms/team-forms";

export const metadata = { title: "Settings" };

const ROLE_LABEL: Record<string, string> = { owner: "Owner", administrator: "Administrator", finance: "Finance", project_manager: "Project Manager", staff: "Staff", read_only: "Read only" };

export default async function SettingsPage() {
  const ctx = await requireOrgContext("/dashboard/settings");
  const { data: members } = await ctx.supabase
    .from("organisation_members")
    .select("id, role, accepted_at, user_id, profiles:profiles!organisation_members_profile_fk(full_name, email)")
    .eq("organisation_id", ctx.organisation.id)
    .order("created_at");
  const canManage = ctx.can("members.invite");
  return (
    <>
      <PageHeader title="Settings" description="Organisation and team access." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Organisation">
          <DescriptionList cols={1} items={[{ label: "Name", value: ctx.organisation.name }, { label: "Your role", value: ROLE_LABEL[ctx.role] }, { label: "Signed in as", value: ctx.user.email }]} />
        </Panel>
        <div className="space-y-6 lg:col-span-2">
          {canManage ? (
            <Panel title="Invite a team member">
              <p className="mb-4 text-sm text-muted-light">They receive an email with a link to set their password. Roles: Owner and Administrator run everything; Finance handles sales, quotes, invoices and payroll prep; Project Managers see only their assigned projects; Staff use the mobile portal; Read only can look but not change.</p>
              <InviteForm canGrantOwner={ctx.role === "owner"} />
            </Panel>
          ) : null}
          <Panel title="Team">
            <ul className="divide-y divide-graphite/10">
              {(members ?? []).map((m) => {
                const p = m.profiles as unknown as { full_name: string | null; email: string | null } | null;
                const isSelf = m.user_id === ctx.user.id;
                const editable = canManage && !isSelf && (m.role !== "owner" || ctx.role === "owner");
                return (
                  <li key={m.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p?.full_name ?? p?.email ?? m.user_id}{isSelf ? " (you)" : ""}</span>
                      {p?.full_name && p?.email ? <span className="block truncate text-xs text-muted-light">{p.email}</span> : null}
                    </span>
                    {editable ? <RoleForm memberId={m.id} role={m.role} canGrantOwner={ctx.role === "owner"} /> : <StatusBadge label={ROLE_LABEL[m.role] ?? m.role} tone={m.role === "owner" ? "copper" : "grey"} />}
                    {editable && ctx.role === "owner" ? <ConfirmAction action={removeMember.bind(null, m.id)} label="Remove" title={`Remove ${p?.full_name ?? p?.email}?`} description="They lose access immediately. Their account isn’t deleted." confirmLabel="Remove" /> : null}
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
