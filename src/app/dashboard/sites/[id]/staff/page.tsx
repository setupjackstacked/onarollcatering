import Link from "next/link";
import { requireOrgContext } from "@/lib/auth/context";
import { listSiteAssignments, getSite } from "@/features/sites/queries";
import { removeFromSite, setAssignmentRole, setPrimarySite } from "@/features/sites/actions";
import { listMembers, memberLabel, memberMap } from "@/features/shared/members";
import { listEmployeeRoles } from "@/features/workforce/queries";
import { Panel } from "@/components/dashboard/primitives";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { AssignToSiteForm } from "@/components/dashboard/forms/site-operations-forms";
import { EmployeeBadge } from "@/lib/domain/badges";
import { formatDateUK } from "@/lib/dates";

export default async function SiteStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const [site, assignments, members, roles, mmap] = await Promise.all([
    getSite(ctx, id), listSiteAssignments(ctx, id), listMembers(ctx), listEmployeeRoles(ctx), memberMap(ctx),
  ]);
  if (!site) return null;
  const canManage = ctx.can("org.manage") || site.oar_manager_id === ctx.user.id
    || assignments.some((a) => a.user_id === ctx.user.id && a.role === "manager");
  const assignedUserIds = new Set(assignments.map((a) => a.user_id));
  const available = members.filter((m) => !assignedUserIds.has(m.user_id)).map((m) => ({ value: m.user_id, label: memberLabel(m) }));
  const managers = assignments.filter((a) => a.role === "manager");
  const staff = assignments.filter((a) => a.role === "staff");

  const row = (a: (typeof assignments)[number]) => {
    const e = a.employees as unknown as { id: string; first_name: string; last_name: string; employee_number: string; role_key: string; status: string; phone: string | null; email: string | null } | null;
    return (
      <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
        <span className="min-w-0 flex-1">
          <span className="block font-medium">
            {e ? <Link href={`/dashboard/employees/${e.id}`} className="underline">{e.first_name} {e.last_name}</Link> : memberLabel(mmap.get(a.user_id))}
            {a.is_primary ? <span className="ml-2 rounded-full bg-copper/15 px-2 py-0.5 text-xs text-copper-dark">Base site</span> : null}
          </span>
          <span className="block text-xs text-muted-light">
            {e ? `${roles.find((r) => r.key === e.role_key)?.label ?? e.role_key} · ${e.employee_number}` : "No employee record yet"}
            {a.starts_on ? ` · from ${formatDateUK(a.starts_on)}` : ""}
            {a.notes ? ` · ${a.notes}` : ""}
          </span>
        </span>
        {e ? <EmployeeBadge status={e.status} /> : null}
        {canManage ? (
          <span className="flex flex-wrap gap-1">
            {!a.is_primary ? <ConfirmAction action={setPrimarySite.bind(null, a.id, id, a.user_id)} label="Make base" title="Make this their base site?" description="Their timesheets and voucher entries will default to it." variant="outline" confirmLabel="Set base" className="h-8 px-3 text-xs" /> : null}
            <ConfirmAction action={setAssignmentRole.bind(null, a.id, id, a.role === "manager" ? "staff" : "manager")}
              label={a.role === "manager" ? "Make staff" : "Make manager"}
              title={a.role === "manager" ? "Remove their site manager rights?" : "Make them a manager of this site?"}
              description={a.role === "manager" ? "They keep access to the site but can no longer approve hours or leave here." : "They will be able to approve timesheets and leave for everyone at this site."}
              variant="outline" confirmLabel="Change role" className="h-8 px-3 text-xs" />
            <ConfirmAction action={removeFromSite.bind(null, a.id, id)} label="Remove" title="Remove them from this site?" description="Their past timesheets and hours are kept." confirmLabel="Remove" className="h-8 px-3 text-xs" />
          </span>
        ) : null}
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <Panel title={`Site managers (${managers.length})`}>
        {managers.length ? <ul className="divide-y divide-graphite/10 text-sm">{managers.map(row)}</ul>
          : <p className="text-sm text-muted-light">No managers assigned. A site manager can approve timesheets and leave for everyone here without being an administrator.</p>}
      </Panel>

      <Panel title={`Staff (${staff.length})`}>
        {staff.length ? <ul className="divide-y divide-graphite/10 text-sm">{staff.map(row)}</ul>
          : <p className="text-sm text-muted-light">Nobody assigned yet.</p>}
      </Panel>

      {canManage ? (
        <Panel title="Add someone to this site">
          {available.length ? (
            <>
              <p className="mb-4 text-sm text-muted-light">They need a login first — invite them under Settings, then assign them here. Linking their employee record happens automatically.</p>
              <AssignToSiteForm siteId={id} people={available} />
            </>
          ) : (
            <p className="text-sm text-muted-light">Everyone with a login is already assigned to this site. Invite more people under <Link href="/dashboard/settings" className="underline">Settings</Link>.</p>
          )}
        </Panel>
      ) : null}
    </div>
  );
}
