import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getEmployee, employeeCounts, listEmployeeRoles } from "@/features/workforce/queries";
import { archiveEmployee } from "@/features/workforce/actions";
import { EntityHeader, ActionLink } from "@/components/dashboard/entity";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { EmployeeBadge } from "@/lib/domain/badges";
import { EMPLOYMENT_TYPES } from "@/features/workforce/schema";
import { EmployeeTabs } from "./tabs";

export default async function EmployeeLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/employees/${id}`);
  if (!ctx.can("workforce.write")) redirect("/dashboard");
  const [employee, counts, roles] = await Promise.all([getEmployee(ctx, id), employeeCounts(ctx, id), listEmployeeRoles(ctx)]);
  if (!employee) notFound();
  const base = `/dashboard/employees/${id}`;
  return (
    <>
      <EntityHeader
        back={{ href: "/dashboard/employees", label: "Employees" }}
        eyebrow={`${roles.find((r) => r.key === employee.role_key)?.label ?? employee.role_key} · ${employee.employee_number}`}
        title={`${employee.first_name} ${employee.last_name}`}
        badge={<EmployeeBadge status={employee.status} />}
        meta={<>{employee.email ? <span>{employee.email}</span> : null}{employee.phone ? <span>{employee.phone}</span> : null}<span>{EMPLOYMENT_TYPES.find((t) => t.value === employee.employment_type)?.label}</span></>}
        actions={<>
          <ActionLink href={`${base}/edit`} variant="obsidian">Edit</ActionLink>
          <ConfirmAction action={archiveEmployee.bind(null, id)} label="Archive" title="Archive this employee?" description="They are marked as a former employee and removed from scheduling. Records are kept." confirmLabel="Archive" />
        </>}
      />
      <EmployeeTabs base={base} counts={counts} />
      {children}
    </>
  );
}
