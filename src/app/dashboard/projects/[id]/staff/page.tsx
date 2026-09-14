import { requireOrgContext } from "@/lib/auth/context";
import { listShifts, employeeMap, listEmployeeRoles } from "@/features/workforce/queries";
import { Panel, Metric } from "@/components/dashboard/primitives";
import { ActionLink } from "@/components/dashboard/entity";
import { RotaWeek, type RotaShift } from "@/components/dashboard/rota-week";
import { startOfWeekISO, isoRange, isoDateOffset, formatDateUK } from "@/lib/dates";
import { str } from "@/lib/pagination";

export default async function ProjectStaffPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await requireOrgContext();
  const week = startOfWeekISO(str(sp.week) || isoDateOffset(0));
  const days = isoRange(week, 7);
  const [shifts, emap, roles] = await Promise.all([listShifts(ctx, { from: days[0], to: days[6] }, { projectId: id }), employeeMap(ctx), listEmployeeRoles(ctx)]);
  const canWrite = ctx.can("workforce.write") || ctx.role === "project_manager";
  const path = `/dashboard/projects/${id}/staff`;
  const self = `${path}?week=${week}`;
  const ids = [...new Set(shifts.map((s) => s.employee_id))];
  const rows = ids.map((eid) => ({ id: eid, label: emap.get(eid)?.full_name ?? "Employee", sub: roles.find((r) => r.key === emap.get(eid)?.role_key)?.label }));
  const hours = shifts.filter((s) => s.status !== "cancelled").reduce((n, s) => n + Number(s.hours), 0);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ActionLink href={`${path}?week=${isoDateOffset(-7, new Date(`${week}T00:00:00Z`))}`}>← Previous</ActionLink>
          <ActionLink href={`${path}?week=${startOfWeekISO(isoDateOffset(0))}`}>This week</ActionLink>
          <ActionLink href={`${path}?week=${isoDateOffset(7, new Date(`${week}T00:00:00Z`))}`}>Next →</ActionLink>
        </div>
        {canWrite ? <ActionLink href={`/dashboard/rota/new?project=${id}&date=${days[0]}&return=${encodeURIComponent(self)}`} variant="copper">Add shift</ActionLink> : null}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Metric label="Week commencing" value={formatDateUK(days[0])} />
        <Metric label="People on site" value={rows.length} />
        <Metric label="Scheduled hours" value={hours.toFixed(2)} />
      </div>
      {rows.length ? (
        <RotaWeek days={days} rows={rows} shifts={shifts as unknown as RotaShift[]} groupBy={(s) => s.employee_id} canWrite={canWrite} returnTo={self} />
      ) : (
        <Panel title="Nobody scheduled"><p className="text-sm text-muted-light">No shifts on this project for the week of {formatDateUK(days[0])}.</p></Panel>
      )}
    </div>
  );
}
