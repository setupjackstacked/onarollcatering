import Link from "next/link";
import { requireStaff, myTimesheets } from "@/features/staff/queries";
import { submitTimesheet, deleteMyTimesheet } from "@/features/staff/actions";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { TimesheetBadge } from "@/lib/domain/badges";
import { formatDateUK, hhmm } from "@/lib/dates";

export const metadata = { title: "Hours" };

export default async function StaffTimesheetsPage() {
  const { ctx, employee } = await requireStaff("/staff/timesheets");
  const rows = await myTimesheets(ctx, employee.id, 60);
  const approvedHours = rows.filter((r) => r.status === "approved" || r.status === "paid").reduce((n, r) => n + Number(r.hours) + Number(r.overtime_hours), 0);
  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display display-sm">Your hours</h1>
        <Link href="/staff/timesheets/new" className="text-sm underline">Log hours</Link>
      </div>
      <p className="text-sm text-muted-light">{approvedHours.toFixed(2)} approved hours in your last {rows.length} entries.</p>
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((t) => {
            const project = t.projects as unknown as { name: string } | null;
            return (
              <li key={t.id} className="rounded-lg border border-graphite/10 bg-white/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="num-lining font-medium">{formatDateUK(t.work_date)}</p>
                    <p className="num-lining text-sm text-muted-light">{hhmm(t.start_time)}–{hhmm(t.end_time)} · {(Number(t.hours) + Number(t.overtime_hours)).toFixed(2)} hours</p>
                    {project ? <p className="text-sm text-muted-light">{project.name}</p> : null}
                  </div>
                  <TimesheetBadge status={t.status} />
                </div>
                {t.status === "rejected" && t.rejection_note ? <p className="mt-2 rounded-md bg-status-danger/10 px-3 py-2 text-xs text-status-danger">{t.rejection_note}</p> : null}
                {t.status === "draft" || t.status === "rejected" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ConfirmAction action={submitTimesheet.bind(null, t.id)} label="Send for approval" title="Send these hours to your manager?" variant="outline" confirmLabel="Send" className="h-9 px-4 text-xs" />
                    {t.status === "draft" ? <ConfirmAction action={deleteMyTimesheet.bind(null, t.id)} label="Delete" title="Delete this draft?" confirmLabel="Delete" className="h-9 px-4 text-xs" /> : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-graphite/20 px-4 py-8 text-center text-sm text-muted-light">No hours logged yet.</p>
      )}
    </div>
  );
}
