import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listShifts, employeeMap, listEmployeeRoles } from "@/features/workforce/queries";
import { listProjectOptions } from "@/features/shared/lookups";
import { PageHeader, Metric, Panel } from "@/components/dashboard/primitives";
import { ActionLink } from "@/components/dashboard/entity";
import { RotaWeek, type RotaShift } from "@/components/dashboard/rota-week";
import { startOfWeekISO, isoRange, isoDateOffset, formatDateUK } from "@/lib/dates";
import { str } from "@/lib/pagination";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Rota" };

export default async function RotaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/rota");
  if (!ctx.can("workforce.read")) redirect("/dashboard");
  const sp = await searchParams;
  const week = startOfWeekISO(str(sp.week) || isoDateOffset(0));
  const view = str(sp.view) === "project" ? "project" : "employee";
  const projectFilter = str(sp.project) || undefined;
  const days = isoRange(week, 7);
  const [shifts, employees, projects, roles] = await Promise.all([
    listShifts(ctx, { from: days[0], to: days[6] }, { projectId: projectFilter }),
    employeeMap(ctx), listProjectOptions(ctx), listEmployeeRoles(ctx),
  ]);
  const canWrite = ctx.can("workforce.write") || ctx.role === "project_manager";
  const href = (p: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { week, view, project: projectFilter, ...p };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    return `/dashboard/rota?${q.toString()}`;
  };
  const self = href({});

  const rows = view === "employee"
    ? [...employees.values()].filter((e) => e.status === "active" || shifts.some((s) => s.employee_id === e.id))
        .map((e) => ({ id: e.id!, label: e.full_name!, sub: roles.find((r) => r.key === e.role_key)?.label ?? e.role_key ?? undefined }))
    : projects.filter((p) => shifts.some((s) => s.project_id === p.value)).map((p) => ({ id: p.value, label: p.label }));

  const totalHours = shifts.filter((s) => s.status !== "cancelled").reduce((n, s) => n + Number(s.hours), 0);
  const drafts = shifts.filter((s) => s.status === "draft").length;

  return (
    <>
      <PageHeader eyebrow="Workforce" title="Rota" description={`Week commencing ${formatDateUK(days[0])}`} actions={canWrite ? <ActionLink href={`/dashboard/rota/new?date=${days[0]}&return=${encodeURIComponent(self)}`} variant="copper">Add shift</ActionLink> : null} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ActionLink href={href({ week: isoDateOffset(-7, new Date(`${week}T00:00:00Z`)) })}>← Previous</ActionLink>
          <ActionLink href={href({ week: startOfWeekISO(isoDateOffset(0)) })}>This week</ActionLink>
          <ActionLink href={href({ week: isoDateOffset(7, new Date(`${week}T00:00:00Z`)) })}>Next →</ActionLink>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-light">Group by</span>
          {(["employee", "project"] as const).map((v) => (
            <Link key={v} href={href({ view: v })} className={cn("rounded-full px-3 py-1", view === v ? "bg-obsidian text-ivory" : "border border-graphite/25")}>
              {v === "employee" ? "Employee" : "Project"}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Metric label="Shifts this week" value={shifts.length} />
        <Metric label="Scheduled hours" value={totalHours.toFixed(2)} />
        <Metric label="Unpublished drafts" value={drafts} tone={drafts ? "warning" : "default"} hint="Staff only see published shifts" />
      </div>

      <RotaWeek days={days} rows={rows} shifts={shifts as unknown as RotaShift[]} groupBy={(s) => (view === "employee" ? s.employee_id : ((s as unknown as { project_id: string | null }).project_id ?? ""))} canWrite={canWrite} returnTo={self} />

      {!rows.length && canWrite ? (
        <Panel title="Nothing scheduled" className="mt-6">
          <p className="text-sm text-muted-light">No active employees yet — add your team under Employees, then build the week here. Shifts stay as drafts until you publish them.</p>
        </Panel>
      ) : null}
    </>
  );
}
