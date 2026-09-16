import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listTimesheets, employeeMap, pendingTimesheetCount } from "@/features/workforce/queries";
import { TIMESHEET_STATUSES } from "@/features/workforce/schema";
import { PageHeader, Metric } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ActionLink } from "@/components/dashboard/entity";
import { TimesheetBadge } from "@/lib/domain/badges";
import { formatDateUK, hhmm } from "@/lib/dates";
import { formatMoney, toPence } from "@/lib/money";
import { pageHref } from "@/lib/query-string";

export const metadata = { title: "Timesheets" };

export default async function TimesheetsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/timesheets");
  if (!ctx.can("workforce.read") && !ctx.can("finance.read")) redirect("/dashboard");
  const sp = await searchParams;
  const [{ rows, total, page, size }, emap, pending] = await Promise.all([listTimesheets(ctx, sp), employeeMap(ctx), pendingTimesheetCount(ctx)]);
  const hours = rows.reduce((n, r) => n + Number(r.hours) + Number(r.overtime_hours), 0);
  const canWrite = ctx.can("workforce.write") || ctx.role === "project_manager";
  return (
    <>
      <PageHeader eyebrow="Workforce" title="Timesheets" description="Hours worked, approved by a manager before they reach payroll and project costs." actions={canWrite ? <ActionLink href="/dashboard/timesheets/new" variant="copper">Log hours</ActionLink> : null} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Metric label="Awaiting approval" value={pending} tone={pending ? "warning" : "default"} href="/dashboard/timesheets?status=submitted" />
        <Metric label="Hours on this page" value={hours.toFixed(2)} />
        <Metric label="Entries" value={total} />
      </div>
      <FilterBar showSearch={false} filters={[{ name: "status", label: "All statuses", options: TIMESHEET_STATUSES }]} />
      <DataTable rows={rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/timesheets/${r.id}`}
        columns={[
          { key: "d", header: "Date", render: (r) => formatDateUK(r.work_date) },
          { key: "e", header: "Employee", render: (r) => emap.get(r.employee_id)?.full_name ?? "—" },
          { key: "p", header: "Project", render: (r) => (r.projects as unknown as { name: string } | null)?.name ?? <span className="text-muted-light">—</span> },
          { key: "t", header: "Times", render: (r) => <span className="num-lining">{hhmm(r.start_time)}–{hhmm(r.end_time)}{r.break_minutes ? <span className="text-muted-light"> · {r.break_minutes}m break</span> : null}</span> },
          { key: "h", header: "Hours", align: "right", render: (r) => <span className="num-lining">{Number(r.hours).toFixed(2)}{Number(r.overtime_hours) > 0 ? <span className="text-copper-dark"> +{Number(r.overtime_hours).toFixed(2)} OT</span> : null}</span> },
          { key: "c", header: "Cost", align: "right", render: (r) => (ctx.can("finance.read") && r.hourly_rate ? formatMoney(Math.round((Number(r.hours) + Number(r.overtime_hours)) * toPence(r.hourly_rate))) : "—") },
          { key: "s", header: "Status", render: (r) => <TimesheetBadge status={r.status} /> },
        ]}
        empty={{ title: "No timesheets yet", description: "Staff can submit their own hours from the staff portal, or log them here.", action: canWrite ? { label: "Log hours", href: "/dashboard/timesheets/new" } : undefined }}
        pagination={{ page, size, total, hrefFor: pageHref("/dashboard/timesheets", sp) }} />
    </>
  );
}
