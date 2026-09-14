import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listEmployeeOptions } from "@/features/workforce/queries";
import { listProjectOptions, listSiteOptions } from "@/features/shared/lookups";
import { EntityHeader } from "@/components/dashboard/entity";
import { TimesheetForm } from "@/components/dashboard/forms/workforce-forms";
import { str } from "@/lib/pagination";
import { isoDateOffset } from "@/lib/dates";

export const metadata = { title: "Log hours" };

export default async function NewTimesheetPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/timesheets/new");
  if (!ctx.can("workforce.write") && ctx.role !== "project_manager") redirect("/dashboard/timesheets");
  const sp = await searchParams;
  const [employees, projects, sites] = await Promise.all([listEmployeeOptions(ctx), listProjectOptions(ctx), listSiteOptions(ctx)]);
  const ret = str(sp.return) || "/dashboard/timesheets";
  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: ret, label: "Timesheets" }} eyebrow="Workforce" title="Log hours" />
      <TimesheetForm employees={employees} projects={projects} sites={sites} returnTo={ret}
        defaults={{ work_date: str(sp.date) || isoDateOffset(-1), employee_id: str(sp.employee) || undefined, project_id: str(sp.project) || undefined }} />
    </div>
  );
}
