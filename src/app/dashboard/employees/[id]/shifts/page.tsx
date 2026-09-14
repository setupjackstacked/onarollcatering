import { requireOrgContext } from "@/lib/auth/context";
import { listShifts } from "@/features/workforce/queries";
import { DataTable } from "@/components/dashboard/data-table";
import { ActionLink } from "@/components/dashboard/entity";
import { ShiftBadge } from "@/lib/domain/badges";
import { formatDateUK, hhmm, isoDateOffset } from "@/lib/dates";

export default async function EmployeeShiftsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const rows = await listShifts(ctx, { from: isoDateOffset(-30), to: isoDateOffset(90) }, { employeeId: id });
  const path = `/dashboard/employees/${id}/shifts`;
  return (
    <div className="space-y-4">
      {ctx.can("workforce.write") ? <div><ActionLink href={`/dashboard/rota/new?employee=${id}&return=${encodeURIComponent(path)}`} variant="copper">Add shift</ActionLink></div> : null}
      <DataTable rows={rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/rota/${r.id}?return=${encodeURIComponent(path)}`}
        columns={[
          { key: "d", header: "Date", render: (r) => formatDateUK(r.shift_date) },
          { key: "t", header: "Times", render: (r) => <span className="num-lining">{hhmm(r.start_time)}–{hhmm(r.end_time)}</span> },
          { key: "p", header: "Project", render: (r) => (r.projects as unknown as { name: string } | null)?.name ?? <span className="text-muted-light">—</span> },
          { key: "h", header: "Hours", align: "right", render: (r) => <span className="num-lining">{Number(r.hours).toFixed(2)}</span> },
          { key: "s", header: "Status", render: (r) => <ShiftBadge status={r.status} /> },
        ]}
        empty={{ title: "No shifts in the last 30 or next 90 days" }} />
    </div>
  );
}
