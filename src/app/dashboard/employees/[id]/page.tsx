import { requireOrgContext } from "@/lib/auth/context";
import { getEmployee, listEmployeeRoles } from "@/features/workforce/queries";
import { getSite } from "@/features/sites/queries";
import { listMembers } from "@/features/shared/members";
import { Panel, Metric } from "@/components/dashboard/primitives";
import { DescriptionList } from "@/components/dashboard/entity";
import { LinkAccountForm } from "@/components/dashboard/forms/workforce-forms";
import { EmployeeInviteForm, ResendInviteForm } from "@/components/dashboard/forms/invite-forms";
import { suggestedRoleForJob } from "@/lib/auth/roles";
import { EMPLOYMENT_TYPES } from "@/features/workforce/schema";
import { formatMoney, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";
import { formatAddress, type Address } from "@/lib/domain/address";

export default async function EmployeeOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const [employee, roles, members] = await Promise.all([getEmployee(ctx, id), listEmployeeRoles(ctx), listMembers(ctx)]);
  if (!employee) return null;
  const site = employee.primary_site_id ? await getSite(ctx, employee.primary_site_id) : null;
  const emg = (employee.emergency_contact ?? {}) as { name?: string; relationship?: string; phone?: string };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Hourly rate" value={employee.hourly_rate ? formatMoney(toPence(employee.hourly_rate)) : "—"} />
        <Metric label="Annual salary" value={employee.salary ? formatMoney(toPence(employee.salary), { showPence: false }) : "—"} />
        <Metric label="Started" value={employee.start_date ? formatDateUK(employee.start_date) : "—"} />
        <Metric label="Base site" value={site?.name ?? "—"} href={site ? `/dashboard/sites/${site.id}/staff` : undefined} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Details">
            <DescriptionList cols={2} items={[
              { label: "Role", value: roles.find((r) => r.key === employee.role_key)?.label ?? employee.role_key },
              { label: "Employment type", value: EMPLOYMENT_TYPES.find((t) => t.value === employee.employment_type)?.label },
              { label: "Email", value: employee.email }, { label: "Phone", value: employee.phone },
              { label: "Address", value: formatAddress(employee.address as Address) || null },
              { label: "End date", value: employee.end_date ? formatDateUK(employee.end_date) : null },
              { label: "Base site", value: site?.name ?? null },
              { label: "Staff portal", value: employee.user_id ? "Linked" : "Not linked" },
            ]} />
          </Panel>
          <Panel title="Emergency contact">
            {emg.name ? <DescriptionList cols={3} items={[{ label: "Name", value: emg.name }, { label: "Relationship", value: emg.relationship }, { label: "Phone", value: emg.phone }]} /> : <p className="text-sm text-muted-light">Not recorded.</p>}
          </Panel>
          {employee.notes ? <Panel title="Notes"><p className="whitespace-pre-wrap text-sm">{employee.notes}</p></Panel> : null}
        </div>
        <div className="space-y-6">
          <Panel title="Login and access">
            {employee.user_id ? (
              <>
                <p className="mb-4 text-sm text-muted-light">
                  {employee.first_name} has a login{employee.email ? ` (${employee.email})` : ""}
                  {employee.invited_at ? `. Last emailed ${formatDateUK(employee.invited_at)}` : ""}.
                </p>
                <ResendInviteForm employeeId={id} />
              </>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-light">
                  {employee.first_name} has no login yet. Add an email address and they&rsquo;ll be sent a welcome
                  message with a link to set their own password — you never see or set it.
                  {employee.invited_at ? ` Last emailed ${formatDateUK(employee.invited_at)}, not yet accepted.` : ""}
                </p>
                <EmployeeInviteForm
                  employeeId={id}
                  suggestedRole={suggestedRoleForJob(employee.role_key)}
                  defaultEmail={employee.email}
                  canGrantOwner={ctx.role === "owner"}
                />
              </>
            )}
          </Panel>
          <Panel title="Link to an existing account">
            <p className="mb-4 text-sm text-muted-light">
              Only needed when someone was invited from Settings before their employee record existed.
            </p>
            <LinkAccountForm id={id} current={employee.user_id} members={members.map((m) => ({ value: m.user_id, label: m.full_name ?? m.email ?? m.user_id }))} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
