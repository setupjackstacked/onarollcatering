import { requireOrgContext } from "@/lib/auth/context";
import { getEmployee, listEmployeeRoles } from "@/features/workforce/queries";
import { listMembers } from "@/features/shared/members";
import { Panel, Metric } from "@/components/dashboard/primitives";
import { DescriptionList } from "@/components/dashboard/entity";
import { LinkAccountForm } from "@/components/dashboard/forms/workforce-forms";
import { EMPLOYMENT_TYPES } from "@/features/workforce/schema";
import { formatGBP, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";
import { formatAddress, type Address } from "@/lib/domain/address";

export default async function EmployeeOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const [employee, roles, members] = await Promise.all([getEmployee(ctx, id), listEmployeeRoles(ctx), listMembers(ctx)]);
  if (!employee) return null;
  const emg = (employee.emergency_contact ?? {}) as { name?: string; relationship?: string; phone?: string };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Hourly rate" value={employee.hourly_rate ? formatGBP(toPence(employee.hourly_rate)) : "—"} />
        <Metric label="Annual salary" value={employee.salary ? formatGBP(toPence(employee.salary), { showPence: false }) : "—"} />
        <Metric label="Started" value={employee.start_date ? formatDateUK(employee.start_date) : "—"} />
        <Metric label="Staff portal" value={employee.user_id ? "Linked" : "Not linked"} />
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
            ]} />
          </Panel>
          <Panel title="Emergency contact">
            {emg.name ? <DescriptionList cols={3} items={[{ label: "Name", value: emg.name }, { label: "Relationship", value: emg.relationship }, { label: "Phone", value: emg.phone }]} /> : <p className="text-sm text-muted-light">Not recorded.</p>}
          </Panel>
          {employee.notes ? <Panel title="Notes"><p className="whitespace-pre-wrap text-sm">{employee.notes}</p></Panel> : null}
        </div>
        <Panel title="Staff portal access">
          <p className="mb-4 text-sm text-muted-light">Link this employee to a team member account so they can see their shifts and submit timesheets at /staff. Invite them from Settings first if they have no login.</p>
          <LinkAccountForm id={id} current={employee.user_id} members={members.map((m) => ({ value: m.user_id, label: m.full_name ?? m.email ?? m.user_id }))} />
        </Panel>
      </div>
    </div>
  );
}
