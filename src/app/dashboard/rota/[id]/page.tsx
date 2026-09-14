import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getShift, listEmployeeOptions, listEmployeeRoles, employeeMap } from "@/features/workforce/queries";
import { deleteShift, logTimesheetFromShift } from "@/features/workforce/actions";
import { listProjectOptions, listSiteOptions } from "@/features/shared/lookups";
import { EntityHeader } from "@/components/dashboard/entity";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { RedirectingAction } from "@/components/dashboard/redirecting-action";
import { ShiftForm } from "@/components/dashboard/forms/workforce-forms";
import { ShiftBadge } from "@/lib/domain/badges";
import { formatDateUK, hhmm } from "@/lib/dates";
import { str } from "@/lib/pagination";

export default async function ShiftPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/rota/${id}`);
  if (!ctx.can("workforce.read")) redirect("/dashboard");
  const shift = await getShift(ctx, id);
  if (!shift) notFound();
  const [employees, projects, sites, roles, emap] = await Promise.all([listEmployeeOptions(ctx), listProjectOptions(ctx), listSiteOptions(ctx), listEmployeeRoles(ctx), employeeMap(ctx)]);
  const ret = str((await searchParams).return) || "/dashboard/rota";
  const canWrite = ctx.can("workforce.write") || ctx.role === "project_manager";
  const who = emap.get(shift.employee_id)?.full_name ?? "Employee";
  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: ret, label: "Rota" }} eyebrow={`${who} · ${formatDateUK(shift.shift_date)}`} title={`${hhmm(shift.start_time)}–${hhmm(shift.end_time)}`} badge={<ShiftBadge status={shift.status} />}
        actions={canWrite ? <>
          {shift.status === "completed" || shift.status === "published" ? <RedirectingAction action={logTimesheetFromShift.bind(null, id)} label="Create timesheet" /> : null}
          <ConfirmAction action={deleteShift.bind(null, id)} label="Delete" title="Delete this shift?" confirmLabel="Delete" />
        </> : null} />
      {canWrite ? (
        <ShiftForm shift={shift} employees={employees} projects={projects} sites={sites} roles={roles.map((r) => ({ value: r.key, label: r.label }))} returnTo={ret} />
      ) : (
        <p className="text-sm text-muted-light">{shift.notes ?? "No notes for this shift."}</p>
      )}
    </div>
  );
}
