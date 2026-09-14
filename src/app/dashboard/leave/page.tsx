import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listLeave, employeeMap, pendingLeaveCount } from "@/features/workforce/queries";
import { setLeaveStatus } from "@/features/workforce/actions";
import { LEAVE_STATUSES, LEAVE_TYPES } from "@/features/workforce/schema";
import { PageHeader, Metric } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ActionLink } from "@/components/dashboard/entity";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { LeaveBadge } from "@/lib/domain/badges";
import { formatDateUK } from "@/lib/dates";
import { pageHref } from "@/lib/query-string";

export const metadata = { title: "Leave" };

export default async function LeavePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/leave");
  if (!ctx.can("workforce.read")) redirect("/dashboard");
  const sp = await searchParams;
  const [{ rows, total, page, size }, emap, pending] = await Promise.all([listLeave(ctx, sp), employeeMap(ctx), pendingLeaveCount(ctx)]);
  const canDecide = ctx.can("workforce.write");
  return (
    <>
      <PageHeader eyebrow="Workforce" title="Leave" description="Approved leave shows as a warning when scheduling shifts." actions={canDecide ? <ActionLink href="/dashboard/leave/new" variant="copper">Record leave</ActionLink> : null} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Metric label="Awaiting decision" value={pending} tone={pending ? "warning" : "default"} href="/dashboard/leave?status=requested" />
        <Metric label="Requests" value={total} />
      </div>
      <FilterBar showSearch={false} filters={[{ name: "status", label: "All statuses", options: LEAVE_STATUSES }]} />
      <DataTable rows={rows} rowKey={(r) => r.id}
        columns={[
          { key: "e", header: "Employee", render: (r) => emap.get(r.employee_id)?.full_name ?? "—" },
          { key: "t", header: "Type", render: (r) => LEAVE_TYPES.find((t) => t.value === r.leave_type)?.label ?? r.leave_type },
          { key: "d", header: "Dates", render: (r) => `${formatDateUK(r.start_date)} – ${formatDateUK(r.end_date)}` },
          { key: "n", header: "Days", align: "right", render: (r) => <span className="num-lining">{Number(r.days)}</span> },
          { key: "r", header: "Reason", render: (r) => r.reason ?? <span className="text-muted-light">—</span> },
          { key: "s", header: "Status", render: (r) => <LeaveBadge status={r.status} /> },
          { key: "a", header: "", align: "right", render: (r) => (canDecide && r.status === "requested" ? (
            <span className="flex justify-end gap-1">
              <ConfirmAction action={setLeaveStatus.bind(null, r.id, "approved", undefined)} label="Approve" title="Approve this leave?" description="It will show as a conflict when scheduling shifts in these dates." variant="outline" confirmLabel="Approve" className="h-8 px-3 text-xs" />
              <ConfirmAction action={setLeaveStatus.bind(null, r.id, "rejected", undefined)} label="Reject" title="Reject this leave request?" confirmLabel="Reject" className="h-8 px-3 text-xs" />
            </span>
          ) : null) },
        ]}
        empty={{ title: "No leave requests", description: "Staff can request leave from the staff portal, or record it here." }}
        pagination={{ page, size, total, hrefFor: pageHref("/dashboard/leave", sp) }} />
    </>
  );
}
