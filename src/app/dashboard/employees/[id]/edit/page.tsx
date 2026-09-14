import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getEmployee, listEmployeeRoles } from "@/features/workforce/queries";
import { EntityHeader } from "@/components/dashboard/entity";
import { EmployeeForm } from "@/components/dashboard/forms/workforce-forms";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/employees/${id}/edit`);
  if (!ctx.can("workforce.write")) redirect(`/dashboard/employees/${id}`);
  const [employee, roles] = await Promise.all([getEmployee(ctx, id), listEmployeeRoles(ctx)]);
  if (!employee) notFound();
  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: `/dashboard/employees/${id}`, label: `${employee.first_name} ${employee.last_name}` }} eyebrow="Editing" title={`${employee.first_name} ${employee.last_name}`} />
      <EmployeeForm employee={employee} roles={roles.map((r) => ({ value: r.key, label: r.label }))} />
    </div>
  );
}
