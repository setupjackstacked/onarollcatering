import Link from "next/link";
import { requireStaff, myLeave } from "@/features/staff/queries";
import { cancelMyLeave } from "@/features/staff/actions";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { LeaveBadge } from "@/lib/domain/badges";
import { LEAVE_TYPES } from "@/features/workforce/schema";
import { SickNoteUpload } from "@/components/staff/sick-form";
import { formatDateUK } from "@/lib/dates";

export const metadata = { title: "Leave" };

export default async function StaffLeavePage() {
  const { ctx, employee } = await requireStaff("/staff/leave");
  const rows = await myLeave(ctx, employee.id);
  const taken = rows.filter((r) => r.status === "approved" && r.leave_type === "holiday").reduce((n, r) => n + Number(r.days), 0);
  const missingNotes = rows.filter((r) => r.document_required && !r.document_id && r.status !== "cancelled");
  return (
    <div className="space-y-5">
      <h1 className="font-display display-sm">Leave</h1>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Link href="/staff/leave/new" className="flex h-12 items-center justify-center rounded-full bg-copper px-5 text-sm font-medium text-ivory">Request holiday</Link>
        <Link href="/staff/leave/sick" className="flex h-12 items-center justify-center rounded-full border border-graphite/25 px-5 text-sm font-medium">Report sick</Link>
      </div>
      <p className="text-sm text-muted-light">{taken} approved holiday days recorded.</p>
      {missingNotes.length ? (
        <p className="rounded-md bg-status-warning/10 px-4 py-3 text-sm">
          {missingNotes.length === 1 ? "One sick absence still needs" : `${missingNotes.length} sick absences still need`} a doctor’s note.
        </p>
      ) : null}
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
                  {l.document_required ? (
                    l.document_id
                      ? <p className="mt-1 text-xs text-status-success">Doctor’s note received</p>
                      : <p className="mt-1 text-xs text-status-warning">Doctor’s note still needed</p>
                  ) : null}
                </div>
                <LeaveBadge status={l.status} />
              </div>
              {l.document_required && !l.document_id && l.status !== "cancelled" ? (
                <div className="mt-3"><SickNoteUpload leaveId={l.id} employeeId={employee.id} /></div>
              ) : null}
              {l.status === "requested" && l.leave_type !== "sick" ? (
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
