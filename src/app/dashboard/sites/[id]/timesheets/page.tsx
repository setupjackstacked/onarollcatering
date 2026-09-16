import { requireOrgContext } from "@/lib/auth/context";
import { listTimesheets, employeeMap } from "@/features/workforce/queries";
import { TIMESHEET_STATUSES } from "@/features/workforce/schema";
import { DataTable } from "@/components/dashboard/data-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ActionLink } from "@/components/dashboard/entity";
import { Metric } from "@/components/dashboard/primitives";
import { TimesheetBadge } from "@/lib/domain/badges";
import { formatDateUK, hhmm } from "@/lib/dates";
import { pageHref } from "@/lib/query-string";

export default async function SiteTimesheetsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await requireOrgContext();
  const [{ rows, total, page, size }, emap] = await Promise.all([listTimesheets(ctx, sp, { siteId: id }), employeeMap(ctx)]);
  const path = `/dashboard/sites/${id}/timesheets`;
  const pending = rows.filter((r) => r.status === "submitted").length;
  const approvedHours = rows.filter((r) => r.status === "approved" || r.status === "paid").reduce((n, r) => n + Number(r.hours) + Number(r.overtime_hours), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Metric label="Awaiting approval" value={pending} tone={pending ? "warning" : "default"} href={`${path}?status=submitted`} />
        <Metric label="Approved hours (page)" value={approvedHours.toFixed(2)} />
        <Metric label="Entries" value={total} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar showSearch={false} filters={[{ name: "status", label: "All statuses", options: TIMESHEET_STATUSES }]} />
        <ActionLink href={`/dashboard/timesheets/new?site=${id}&return=${encodeURIComponent(path)}`} variant="copper">Log hours</ActionLink>
      </div>
      <DataTable rows={rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/timesheets/${r.id}`}
        columns={[
          { key: "d", header: "Date", render: (r) => formatDateUK(r.work_date) },
          { key: "e", header: "Employee", render: (r) => emap.get(r.employee_id)?.full_name ?? "—" },
          { key: "t", header: "Times", render: (r) => <span className="num-lining">{hhmm(r.start_time)}–{hhmm(r.end_time)}</span> },
          { key: "h", header: "Hours", align: "right", render: (r) => <span className="num-lining">{(Number(r.hours) + Number(r.overtime_hours)).toFixed(2)}</span> },
          { key: "s", header: "Status", render: (r) => <TimesheetBadge status={r.status} /> },
        ]}
        empty={{ title: "No hours logged at this site yet" }}
        pagination={{ page, size, total, hrefFor: pageHref(path, sp) }} />
    </div>
  );
}
