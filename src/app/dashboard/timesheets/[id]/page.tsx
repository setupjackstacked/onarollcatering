import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getTimesheet, employeeMap, listEmployeeOptions } from "@/features/workforce/queries";
import { setTimesheetStatus, deleteTimesheet } from "@/features/workforce/actions";
import { listProjectOptions, listSiteOptions } from "@/features/shared/lookups";
import { EntityHeader, DescriptionList, ActionLink } from "@/components/dashboard/entity";
import { Panel, Metric } from "@/components/dashboard/primitives";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { TimesheetForm, RejectTimesheetForm } from "@/components/dashboard/forms/workforce-forms";
import { listActivity } from "@/features/shared/activity";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { TimesheetBadge } from "@/lib/domain/badges";
import { formatDateUK, hhmm } from "@/lib/dates";
import { formatGBP, toPence } from "@/lib/money";

export default async function TimesheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/timesheets/${id}`);
  const ts = await getTimesheet(ctx, id);
  if (!ts) notFound();
  const [emap, employees, projects, sites, activity] = await Promise.all([employeeMap(ctx), listEmployeeOptions(ctx), listProjectOptions(ctx), listSiteOptions(ctx), listActivity(ctx, "timesheets", id)]);
  const project = ts.projects as unknown as { id: string; name: string; project_number: string } | null;
  const who = emap.get(ts.employee_id)?.full_name ?? "Employee";
  const isManager = ctx.can("workforce.write") || ctx.role === "project_manager";
  const editable = ts.status === "draft" || ts.status === "rejected";
  const canEdit = editable && (isManager || emap.get(ts.employee_id)?.user_id === ctx.user.id);
  const total = Number(ts.hours) + Number(ts.overtime_hours);
  if (!isManager && emap.get(ts.employee_id)?.user_id !== ctx.user.id && !ctx.can("finance.read")) redirect("/dashboard");
  return (
    <>
      <EntityHeader back={{ href: "/dashboard/timesheets", label: "Timesheets" }} eyebrow={`${who} · ${formatDateUK(ts.work_date)}`} title={`${hhmm(ts.start_time)}–${hhmm(ts.end_time)}`} badge={<TimesheetBadge status={ts.status} />}
        meta={<>{project ? <Link href={`/dashboard/projects/${project.id}`} className="underline">{project.project_number} · {project.name}</Link> : <span>No project</span>}</>}
        actions={<>
          {ts.status === "draft" ? <ConfirmAction action={setTimesheetStatus.bind(null, id, "submitted")} label="Submit for approval" title="Submit this timesheet?" description="Your manager will review it. You can’t edit it after submitting." variant="outline" confirmLabel="Submit" /> : null}
          {isManager && ts.status === "submitted" ? <ConfirmAction action={setTimesheetStatus.bind(null, id, "approved")} label="Approve" title="Approve this timesheet?" description="Approved hours count towards project labour cost and payroll." variant="outline" confirmLabel="Approve" /> : null}
          {ctx.can("workforce.write") && ts.status === "approved" ? <ConfirmAction action={setTimesheetStatus.bind(null, id, "draft")} label="Reopen" title="Reopen this timesheet?" description="It returns to draft and stops counting towards costs." confirmLabel="Reopen" /> : null}
          {canEdit ? <ConfirmAction action={deleteTimesheet.bind(null, id)} label="Delete" title="Delete this timesheet?" confirmLabel="Delete" /> : null}
        </>} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Hours worked" value={Number(ts.hours).toFixed(2)} />
        <Metric label="Overtime" value={Number(ts.overtime_hours).toFixed(2)} />
        <Metric label="Total" value={total.toFixed(2)} />
        {ctx.can("finance.read") ? <Metric label="Labour cost" value={ts.hourly_rate ? formatGBP(Math.round(total * toPence(ts.hourly_rate))) : "—"} hint={ts.hourly_rate ? `at ${formatGBP(toPence(ts.hourly_rate))}/hr` : "Rate applied on approval"} /> : null}
      </div>
      {ts.status === "rejected" && ts.rejection_note ? <p className="mb-6 rounded-md bg-status-danger/10 px-4 py-3 text-sm text-status-danger">Returned for correction: {ts.rejection_note}</p> : null}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {canEdit ? (
            <Panel title="Edit"><TimesheetForm timesheet={ts} employees={employees} projects={projects} sites={sites} returnTo={`/dashboard/timesheets/${id}`} lockEmployee={!isManager} /></Panel>
          ) : (
            <Panel title="Details">
              <DescriptionList cols={2} items={[
                { label: "Break", value: `${ts.break_minutes} minutes` }, { label: "Submitted", value: ts.submitted_at ? formatDateUK(ts.submitted_at, true) : null },
                { label: "Approved", value: ts.approved_at ? formatDateUK(ts.approved_at, true) : null }, { label: "Notes", value: ts.notes },
              ]} />
            </Panel>
          )}
          {isManager && ts.status === "submitted" ? <Panel title="Return for correction"><RejectTimesheetForm id={id} /></Panel> : null}
        </div>
        <div className="space-y-6">
          <Panel title="Activity"><ActivityTimeline rows={activity} /></Panel>
          {ctx.can("workforce.read") ? <Panel title="Employee"><ActionLink href={`/dashboard/employees/${ts.employee_id}/timesheets`}>All timesheets for {who}</ActionLink></Panel> : null}
        </div>
      </div>
    </>
  );
}
