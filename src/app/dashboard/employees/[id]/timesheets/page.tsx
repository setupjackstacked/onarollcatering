import { requireOrgContext } from "@/lib/auth/context";
import { listTimesheets } from "@/features/workforce/queries";
import { DataTable } from "@/components/dashboard/data-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ActionLink } from "@/components/dashboard/entity";
import { TIMESHEET_STATUSES } from "@/features/workforce/schema";
import { TimesheetBadge } from "@/lib/domain/badges";
import { formatDateUK, hhmm } from "@/lib/dates";
import { pageHref } from "@/lib/query-string";

export default async function EmployeeTimesheetsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await requireOrgContext();
  const { rows, total, page, size } = await listTimesheets(ctx, sp, { employeeId: id });
  const path = `/dashboard/employees/${id}/timesheets`;
  const totalHours = rows.reduce((n, r) => n + Number(r.hours) + Number(r.overtime_hours), 0);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar showSearch={false} filters={[{ name: "status", label: "All statuses", options: TIMESHEET_STATUSES }]} />
        {ctx.can("workforce.write") ? <ActionLink href={`/dashboard/timesheets/new?employee=${id}&return=${encodeURIComponent(path)}`} variant="copper">Log hours</ActionLink> : null}
      </div>
      <p className="text-sm text-muted-light">Hours on this page: <span className="num-lining font-medium text-graphite">{totalHours.toFixed(2)}</span></p>
      <DataTable rows={rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/timesheets/${r.id}`}
        columns={[
          { key: "d", header: "Date", render: (r) => formatDateUK(r.work_date) },
          { key: "t", header: "Times", render: (r) => <span className="num-lining">{hhmm(r.start_time)}–{hhmm(r.end_time)}</span> },
          { key: "p", header: "Project", render: (r) => (r.projects as unknown as { name: string } | null)?.name ?? <span className="text-muted-light">—</span> },
          { key: "h", header: "Hours", align: "right", render: (r) => <span className="num-lining">{(Number(r.hours) + Number(r.overtime_hours)).toFixed(2)}</span> },
          { key: "s", header: "Status", render: (r) => <TimesheetBadge status={r.status} /> },
        ]}
        empty={{ title: "No timesheets for this employee" }}
        pagination={{ page, size, total, hrefFor: pageHref(path, sp) }} />
    </div>
  );
}
