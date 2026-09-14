import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listEmployeeOptions, listEmployeeRoles } from "@/features/workforce/queries";
import { listProjectOptions, listSiteOptions } from "@/features/shared/lookups";
import { EntityHeader } from "@/components/dashboard/entity";
import { ShiftForm } from "@/components/dashboard/forms/workforce-forms";
import { str } from "@/lib/pagination";
import { isoDateOffset } from "@/lib/dates";

export const metadata = { title: "Add shift" };

export default async function NewShiftPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/rota/new");
  if (!ctx.can("workforce.write") && ctx.role !== "project_manager") redirect("/dashboard/rota");
  const sp = await searchParams;
  const [employees, projects, sites, roles] = await Promise.all([listEmployeeOptions(ctx), listProjectOptions(ctx), listSiteOptions(ctx), listEmployeeRoles(ctx)]);
  const ret = str(sp.return) || "/dashboard/rota";
  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: ret, label: "Rota" }} eyebrow="Workforce" title="Add shift" />
      {employees.length ? (
        <ShiftForm employees={employees} projects={projects} sites={sites} roles={roles.map((r) => ({ value: r.key, label: r.label }))} returnTo={ret}
          defaults={{ shift_date: str(sp.date) || isoDateOffset(0), employee_id: str(sp.employee) || undefined, project_id: str(sp.project) || undefined }} />
      ) : (
        <p className="rounded-md bg-status-warning/10 px-4 py-3 text-sm">Add an employee first — there’s nobody to schedule yet.</p>
      )}
    </div>
  );
}
