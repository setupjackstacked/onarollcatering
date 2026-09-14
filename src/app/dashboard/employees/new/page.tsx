import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listEmployeeRoles } from "@/features/workforce/queries";
import { EntityHeader } from "@/components/dashboard/entity";
import { EmployeeForm } from "@/components/dashboard/forms/workforce-forms";

export const metadata = { title: "Add employee" };

export default async function NewEmployeePage() {
  const ctx = await requireOrgContext("/dashboard/employees/new");
  if (!ctx.can("workforce.write")) redirect("/dashboard/employees");
  const roles = await listEmployeeRoles(ctx);
  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: "/dashboard/employees", label: "Employees" }} eyebrow="Workforce" title="Add employee" />
      <EmployeeForm roles={roles.map((r) => ({ value: r.key, label: r.label }))} />
    </div>
  );
}
