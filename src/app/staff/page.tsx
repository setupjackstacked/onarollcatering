import Link from "next/link";
import { requireStaff, myNextShift, shiftsAwaitingHours, myTimesheets, myLeave } from "@/features/staff/queries";
import { ShiftCard, type StaffShift } from "@/components/staff/cards";
import { TimesheetBadge, LeaveBadge } from "@/lib/domain/badges";
import { formatDateUK, hhmm, isoDateOffset } from "@/lib/dates";

export const metadata = { title: "Today" };

export default async function StaffHomePage() {
  const { ctx, employee } = await requireStaff();
  const [next, awaiting, timesheets, leave] = await Promise.all([
    myNextShift(ctx, employee.id), shiftsAwaitingHours(ctx, employee.id), myTimesheets(ctx, employee.id, 5), myLeave(ctx, employee.id),
  ]);
  const today = isoDateOffset(0);
  const rejected = timesheets.filter((t) => t.status === "rejected");
  const pendingLeave = leave.filter((l) => l.status === "requested" && l.leave_type !== "sick");
  const missingNotes = leave.filter((l) => l.document_required && !l.document_id && l.status !== "cancelled");

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-copper-dark">Hello {employee.first_name}</p>
        <h1 className="font-display display-sm mt-1">{next ? (next.shift_date === today ? "You’re on today" : "Your next shift") : "No shifts scheduled"}</h1>
      </div>

      {next ? <ShiftCard shift={next as unknown as StaffShift} highlight /> : (
        <p className="rounded-lg border border-dashed border-graphite/20 px-4 py-8 text-center text-sm text-muted-light">Nothing on the rota for you yet. Published shifts appear here.</p>
      )}

      {missingNotes.length ? (
        <section className="rounded-lg bg-status-warning/10 p-4">
          <h2 className="text-sm font-medium">Doctor’s note needed</h2>
          <p className="mt-1 text-sm">
            {missingNotes.map((l, i) => <span key={l.id}>{i ? ", " : ""}{formatDateUK(l.start_date)}</span>)} — <Link href="/staff/leave" className="underline">upload it here</Link>.
          </p>
        </section>
      ) : null}

      {rejected.length ? (
        <section className="rounded-lg bg-status-danger/10 p-4">
          <h2 className="text-sm font-medium text-status-danger">Hours need correcting</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {rejected.map((t) => (
              <li key={t.id}><Link href="/staff/timesheets" className="underline">{formatDateUK(t.work_date)}</Link>{t.rejection_note ? ` — ${t.rejection_note}` : ""}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {awaiting.length ? (
        <section>
          <h2 className="font-display text-xl">Log your hours</h2>
          <p className="mt-1 text-sm text-muted-light">{awaiting.length} recent shift{awaiting.length === 1 ? "" : "s"} without a timesheet.</p>
          <ul className="mt-3 space-y-2">
            {awaiting.slice(0, 5).map((s) => {
              const project = s.projects as unknown as { name: string } | null;
              return (
                <li key={s.id}>
                  <Link href={`/staff/timesheets/new?shift=${s.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-graphite/10 bg-white/50 px-4 py-3">
                    <span>
                      <span className="num-lining block font-medium">{formatDateUK(s.shift_date)} · {hhmm(s.start_time)}–{hhmm(s.end_time)}</span>
                      {project ? <span className="block text-xs text-muted-light">{project.name}</span> : null}
                    </span>
                    <span className="shrink-0 text-sm text-copper-dark">Log hours →</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        <Link href="/staff/timesheets/new" className="col-span-2 flex h-12 items-center justify-center rounded-full bg-copper px-5 text-sm font-medium text-ivory">Log hours</Link>
        <Link href="/staff/vouchers" className="flex h-12 items-center justify-center rounded-full border border-graphite/25 px-4 text-sm font-medium">Log vouchers</Link>
        <Link href="/staff/leave/new" className="flex h-12 items-center justify-center rounded-full border border-graphite/25 px-4 text-sm font-medium">Request holiday</Link>
        <Link href="/staff/leave/sick" className="col-span-2 flex h-12 items-center justify-center rounded-full border border-graphite/25 px-5 text-sm font-medium">Report sick</Link>
      </section>

      {timesheets.length ? (
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl">Recent hours</h2>
            <Link href="/staff/timesheets" className="text-sm underline">All</Link>
          </div>
          <ul className="mt-3 divide-y divide-graphite/10 rounded-lg border border-graphite/10 bg-white/50">
            {timesheets.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span><span className="num-lining font-medium">{formatDateUK(t.work_date)}</span><span className="block text-xs text-muted-light">{(Number(t.hours) + Number(t.overtime_hours)).toFixed(2)} hours</span></span>
                <TimesheetBadge status={t.status} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {pendingLeave.length ? (
        <section>
          <h2 className="font-display text-xl">Leave awaiting a decision</h2>
          <ul className="mt-3 divide-y divide-graphite/10 rounded-lg border border-graphite/10 bg-white/50">
            {pendingLeave.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>{formatDateUK(l.start_date)} – {formatDateUK(l.end_date)}<span className="block text-xs text-muted-light">{Number(l.days)} days</span></span>
                <LeaveBadge status={l.status} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
