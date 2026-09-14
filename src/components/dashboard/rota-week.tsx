import Link from "next/link";
import { dayLabel, hhmm, isoDateOffset } from "@/lib/dates";
import { cn } from "@/lib/utils/cn";

export type RotaShift = {
  id: string;
  employee_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  hours: string;
  status: string;
  role_key: string | null;
  projects?: unknown;
};

type Row = { id: string; label: string; sub?: string };

/**
 * Week grid: one row per employee (or project), one column per day.
 * Server component — links open the shift editor; no client JS.
 */
export function RotaWeek({ days, rows, shifts, groupBy, canWrite, returnTo }: {
  days: string[];
  rows: Row[];
  shifts: RotaShift[];
  groupBy: (s: RotaShift) => string;
  canWrite: boolean;
  returnTo: string;
}) {
  const today = isoDateOffset(0);
  const byCell = new Map<string, RotaShift[]>();
  for (const s of shifts) {
    const key = `${groupBy(s)}|${s.shift_date}`;
    byCell.set(key, [...(byCell.get(key) ?? []), s]);
  }
  const totalFor = (rowId: string) =>
    shifts.filter((s) => groupBy(s) === rowId && s.status !== "cancelled").reduce((n, s) => n + Number(s.hours), 0);

  if (!rows.length) {
    return <p className="rounded-lg border border-dashed border-graphite/20 px-6 py-12 text-center text-sm text-muted-light">Nothing to show for this week.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-graphite/10 bg-white/40">
      <table className="w-full min-w-[56rem] text-sm">
        <thead>
          <tr className="border-b border-graphite/10 text-left text-xs uppercase tracking-wider text-muted-light">
            <th className="w-48 px-3 py-2 font-medium">&nbsp;</th>
            {days.map((d) => (
              <th key={d} className={cn("px-2 py-2 font-medium", d === today && "text-copper-dark")}>{dayLabel(d)}</th>
            ))}
            <th className="w-20 px-3 py-2 text-right font-medium">Hours</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-graphite/10">
          {rows.map((row) => (
            <tr key={row.id} className="align-top">
              <th scope="row" className="px-3 py-2 text-left font-medium">
                {row.label}
                {row.sub ? <span className="block text-xs font-normal text-muted-light">{row.sub}</span> : null}
              </th>
              {days.map((d) => {
                const cell = byCell.get(`${row.id}|${d}`) ?? [];
                return (
                  <td key={d} className={cn("px-1.5 py-1.5", d === today && "bg-copper/[0.04]")}>
                    <div className="space-y-1">
                      {cell.map((s) => {
                        const project = s.projects as { name: string; project_number: string } | null;
                        const body = (
                          <>
                            <span className="num-lining block font-medium">{hhmm(s.start_time)}–{hhmm(s.end_time)}</span>
                            {project ? <span className="block truncate text-[0.6875rem] text-muted-light">{project.name}</span> : null}
                          </>
                        );
                        const cls = cn(
                          "block rounded-md border px-2 py-1 text-xs",
                          s.status === "cancelled" && "border-graphite/15 bg-graphite/5 text-muted-light line-through",
                          s.status === "draft" && "border-dashed border-graphite/30 bg-white/60",
                          s.status === "published" && "border-copper/30 bg-copper/10",
                          s.status === "completed" && "border-status-success/30 bg-status-success/10",
                        );
                        return canWrite ? (
                          <Link key={s.id} href={`/dashboard/rota/${s.id}?return=${encodeURIComponent(returnTo)}`} className={cn(cls, "hover:border-graphite")}>{body}</Link>
                        ) : (
                          <span key={s.id} className={cls}>{body}</span>
                        );
                      })}
                      {canWrite ? (
                        <Link href={`/dashboard/rota/new?date=${d}&employee=${row.id}&return=${encodeURIComponent(returnTo)}`} className="block rounded-md border border-dashed border-graphite/20 px-2 py-1 text-center text-xs text-muted-light hover:border-copper hover:text-copper-dark">
                          +
                        </Link>
                      ) : null}
                    </div>
                  </td>
                );
              })}
              <td className="px-3 py-2 text-right num-lining">{totalFor(row.id).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
