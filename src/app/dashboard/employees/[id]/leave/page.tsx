import { requireOrgContext } from "@/lib/auth/context";
import { listLeave } from "@/features/workforce/queries";
import { setLeaveStatus } from "@/features/workforce/actions";
import { LEAVE_TYPES } from "@/features/workforce/schema";
import { DataTable } from "@/components/dashboard/data-table";
import { ActionLink } from "@/components/dashboard/entity";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { LeaveBadge } from "@/lib/domain/badges";
import { formatDateUK } from "@/lib/dates";

export default async function EmployeeLeavePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const { rows } = await listLeave(ctx, await searchParams, { employeeId: id });
  const canDecide = ctx.can("workforce.write");
  const path = `/dashboard/employees/${id}/leave`;
  return (
    <div className="space-y-4">
      {canDecide ? <div><ActionLink href={`/dashboard/leave/new?employee=${id}&return=${encodeURIComponent(path)}`} variant="copper">Record leave</ActionLink></div> : null}
      <DataTable rows={rows} rowKey={(r) => r.id}
        columns={[
          { key: "t", header: "Type", render: (r) => LEAVE_TYPES.find((t) => t.value === r.leave_type)?.label ?? r.leave_type },
          { key: "d", header: "Dates", render: (r) => `${formatDateUK(r.start_date)} – ${formatDateUK(r.end_date)}` },
          { key: "n", header: "Days", align: "right", render: (r) => <span className="num-lining">{Number(r.days)}</span> },
          { key: "s", header: "Status", render: (r) => <LeaveBadge status={r.status} /> },
          { key: "a", header: "", align: "right", render: (r) => (canDecide && r.status === "requested" ? (
            <span className="flex justify-end gap-1">
              <ConfirmAction action={setLeaveStatus.bind(null, r.id, "approved", undefined)} label="Approve" title="Approve this leave?" variant="outline" confirmLabel="Approve" className="h-8 px-3 text-xs" />
              <ConfirmAction action={setLeaveStatus.bind(null, r.id, "rejected", undefined)} label="Reject" title="Reject this request?" confirmLabel="Reject" className="h-8 px-3 text-xs" />
            </span>
          ) : null) },
        ]}
        empty={{ title: "No leave recorded" }} />
    </div>
  );
}
