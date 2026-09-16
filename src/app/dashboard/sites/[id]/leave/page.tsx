import { requireOrgContext } from "@/lib/auth/context";
import { listSiteAssignments } from "@/features/sites/queries";
import { setLeaveStatus } from "@/features/workforce/actions";
import { LEAVE_TYPES, LEAVE_STATUSES } from "@/features/workforce/schema";
import { employeeMap } from "@/features/workforce/queries";
import { DataTable } from "@/components/dashboard/data-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ActionLink } from "@/components/dashboard/entity";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { Panel, Metric } from "@/components/dashboard/primitives";
import { LeaveBadge } from "@/lib/domain/badges";
import { formatDateUK, isoDateOffset } from "@/lib/dates";
import { str } from "@/lib/pagination";

/** Leave for everyone based at this site, so a manager can spot cover gaps. */
export default async function SiteLeavePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await requireOrgContext();
  const [assignments, emap] = await Promise.all([listSiteAssignments(ctx, id), employeeMap(ctx)]);
  const employeeIds = assignments.map((a) => a.employee_id).filter((x): x is string => !!x);
  const status = str(sp.status);

  let rows: { id: string; employee_id: string; leave_type: string; start_date: string; end_date: string; days: string; status: string; reason: string | null }[] = [];
  if (employeeIds.length) {
    let q = ctx.supabase.from("leave_requests").select("id, employee_id, leave_type, start_date, end_date, days, status, reason")
      .in("employee_id", employeeIds).gte("end_date", isoDateOffset(-90)).order("start_date", { ascending: false }).limit(200);
    if (status) q = q.eq("status", status as never);
    const { data } = await q;
    rows = data ?? [];
  }

  const today = isoDateOffset(0);
  const away = rows.filter((r) => r.status === "approved" && r.start_date <= today && r.end_date >= today).length;
  const pending = rows.filter((r) => r.status === "requested").length;
  const canDecide = ctx.can("workforce.write") || ctx.can("org.manage");
  const path = `/dashboard/sites/${id}/leave`;

  if (!employeeIds.length) {
    return <Panel title="Leave"><p className="text-sm text-muted-light">Nobody is assigned to this site yet, so there is no leave to show.</p></Panel>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Metric label="Away today" value={away} tone={away ? "warning" : "default"} />
        <Metric label="Awaiting a decision" value={pending} tone={pending ? "warning" : "default"} href={`${path}?status=requested`} />
        <Metric label="Team at this site" value={employeeIds.length} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar showSearch={false} filters={[{ name: "status", label: "All statuses", options: LEAVE_STATUSES }]} />
        {canDecide ? <ActionLink href={`/dashboard/leave/new?return=${encodeURIComponent(path)}`} variant="copper">Record leave</ActionLink> : null}
      </div>
      <DataTable rows={rows} rowKey={(r) => r.id}
        columns={[
          { key: "e", header: "Employee", render: (r) => emap.get(r.employee_id)?.full_name ?? "—" },
          { key: "t", header: "Type", render: (r) => LEAVE_TYPES.find((t) => t.value === r.leave_type)?.label ?? r.leave_type },
          { key: "d", header: "Dates", render: (r) => `${formatDateUK(r.start_date)} – ${formatDateUK(r.end_date)}` },
          { key: "n", header: "Days", align: "right", render: (r) => <span className="num-lining">{Number(r.days)}</span> },
          { key: "s", header: "Status", render: (r) => <LeaveBadge status={r.status} /> },
          { key: "a", header: "", align: "right", render: (r) => (canDecide && r.status === "requested" ? (
            <span className="flex justify-end gap-1">
              <ConfirmAction action={setLeaveStatus.bind(null, r.id, "approved", undefined)} label="Approve" title="Approve this leave?" description="It will show as a conflict when scheduling shifts in these dates." variant="outline" confirmLabel="Approve" className="h-8 px-3 text-xs" />
              <ConfirmAction action={setLeaveStatus.bind(null, r.id, "rejected", undefined)} label="Reject" title="Reject this request?" confirmLabel="Reject" className="h-8 px-3 text-xs" />
            </span>
          ) : null) },
        ]}
        empty={{ title: "No leave in the last 90 days for this team" }} />
    </div>
  );
}
