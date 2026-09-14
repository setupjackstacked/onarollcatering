import Link from "next/link";
import { requireStaff, myLeave } from "@/features/staff/queries";
import { cancelMyLeave } from "@/features/staff/actions";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { LeaveBadge } from "@/lib/domain/badges";
import { LEAVE_TYPES } from "@/features/workforce/schema";
import { formatDateUK } from "@/lib/dates";

export const metadata = { title: "Leave" };

export default async function StaffLeavePage() {
  const { ctx, employee } = await requireStaff("/staff/leave");
  const rows = await myLeave(ctx, employee.id);
  const taken = rows.filter((r) => r.status === "approved" && r.leave_type === "holiday").reduce((n, r) => n + Number(r.days), 0);
  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display display-sm">Leave</h1>
        <Link href="/staff/leave/new" className="text-sm underline">Request leave</Link>
      </div>
      <p className="text-sm text-muted-light">{taken} approved holiday days recorded.</p>
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((l) => (
            <li key={l.id} className="rounded-lg border border-graphite/10 bg-white/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{formatDateUK(l.start_date)} – {formatDateUK(l.end_date)}</p>
                  <p className="text-sm text-muted-light">{LEAVE_TYPES.find((t) => t.value === l.leave_type)?.label} · {Number(l.days)} days</p>
                  {l.reason ? <p className="mt-1 text-sm">{l.reason}</p> : null}
                  {l.decision_note ? <p className="mt-1 text-xs text-muted-light">{l.decision_note}</p> : null}
                </div>
                <LeaveBadge status={l.status} />
              </div>
              {l.status === "requested" ? (
                <div className="mt-3"><ConfirmAction action={cancelMyLeave.bind(null, l.id)} label="Cancel request" title="Cancel this leave request?" confirmLabel="Cancel request" className="h-9 px-4 text-xs" /></div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-graphite/20 px-4 py-8 text-center text-sm text-muted-light">No leave requested yet.</p>
      )}
    </div>
  );
}
