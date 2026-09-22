import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listEmployees, listEmployeeRoles, expiringDocuments, employeesWithoutAccess } from "@/features/workforce/queries";
import { EMPLOYMENT_TYPES } from "@/features/workforce/schema";
import { PageHeader, Metric } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ActionLink } from "@/components/dashboard/entity";
import { EmployeeBadge } from "@/lib/domain/badges";
import { formatDateUK, isoDateOffset } from "@/lib/dates";
import { pageHref } from "@/lib/query-string";

export const metadata = { title: "Employees" };

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/employees");
  if (!ctx.can("workforce.read")) redirect("/dashboard");
  const sp = await searchParams;
  const canManage = ctx.can("workforce.write");
  if (!canManage) redirect("/dashboard/rota");
  const [{ rows, total, page, size }, roles, expiring, withoutAccess] = await Promise.all([
    listEmployees(ctx, sp),
    listEmployeeRoles(ctx),
    expiringDocuments(ctx, 30),
    employeesWithoutAccess(ctx),
  ]);
  const needsEmail = withoutAccess.filter((e) => e.state === "no_email").length;
  const today = isoDateOffset(0);
  const expired = expiring.filter((d) => (d.expiry_date ?? "") < today).length;
  const roleLabel = (k: string) => roles.find((r) => r.key === k)?.label ?? k;
  return (
    <>
      <PageHeader eyebrow="Workforce" title="Employees" actions={<ActionLink href="/dashboard/employees/new" variant="copper">Add employee</ActionLink>} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="On the team" value={total} />
        <Metric label="No login yet" value={withoutAccess.length} tone={needsEmail > 0 ? "warning" : "default"} />
        <Metric label="Documents expiring (30 days)" value={expiring.length - expired} tone={expiring.length - expired > 0 ? "warning" : "default"} />
        <Metric label="Documents expired" value={expired} tone={expired > 0 ? "warning" : "default"} />
      </div>
      <FilterBar
        filters={[
          { name: "status", label: "Active", options: [{ value: "all", label: "All statuses" }, { value: "active", label: "Active" }, { value: "on_leave", label: "On leave" }, { value: "inactive", label: "Inactive" }, { value: "former", label: "Former" }] },
          { name: "role", label: "All roles", options: roles.map((r) => ({ value: r.key, label: r.label })) },
        ]}
        searchPlaceholder="Name, email or number" />
      <DataTable rows={rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/employees/${r.id}`}
        columns={[
          { key: "n", header: "Name", render: (r) => <span>{r.first_name} {r.last_name}<span className="block text-xs text-muted-light num-lining">{r.employee_number}</span></span> },
          { key: "r", header: "Role", render: (r) => roleLabel(r.role_key) },
          { key: "t", header: "Type", render: (r) => EMPLOYMENT_TYPES.find((t) => t.value === r.employment_type)?.label ?? r.employment_type },
          { key: "c", header: "Contact", render: (r) => <span className="text-muted-light">{r.email ?? r.phone ?? "—"}</span> },
          { key: "s", header: "Status", render: (r) => <EmployeeBadge status={r.status} /> },
          { key: "sd", header: "Started", render: (r) => formatDateUK(r.start_date) },
          { key: "p", header: "Access", render: (r) => (r.user_id ? "Can log in" : r.email ? <span className="text-status-warning">Invite pending</span> : <span className="text-muted-light">Needs an email</span>) },
        ]}
        empty={{ title: "No employees yet", description: "Add your team to build rotas, collect timesheets and track compliance documents.", action: { label: "Add employee", href: "/dashboard/employees/new" } }}
        pagination={{ page, size, total, hrefFor: pageHref("/dashboard/employees", sp) }} />
    </>
  );
}
