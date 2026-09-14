import Link from "next/link";
import { requireStaff } from "@/features/staff/queries";
import { getShift } from "@/features/workforce/queries";
import { listProjectOptions, listSiteOptions } from "@/features/shared/lookups";
import { LogHoursForm } from "@/components/staff/forms";
import { str } from "@/lib/pagination";
import { isoDateOffset, hhmm } from "@/lib/dates";

export const metadata = { title: "Log hours" };

export default async function LogHoursPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx } = await requireStaff("/staff/timesheets/new");
  const sp = await searchParams;
  const shiftId = str(sp.shift);
  const [shift, projects, sites] = await Promise.all([
    shiftId ? getShift(ctx, shiftId) : Promise.resolve(null),
    listProjectOptions(ctx), listSiteOptions(ctx),
  ]);
  return (
    <div className="space-y-5">
      <div>
        <Link href="/staff/timesheets" className="text-sm underline">← Your hours</Link>
        <h1 className="font-display display-sm mt-2">Log hours</h1>
        {shift ? <p className="mt-1 text-sm text-muted-light">Pre-filled from your shift. Change the times if they differ from what you actually worked.</p> : null}
      </div>
      <LogHoursForm projects={projects} sites={sites}
        defaults={{
          work_date: shift?.shift_date ?? isoDateOffset(0),
          start: shift ? hhmm(shift.start_time) : undefined,
          end: shift ? hhmm(shift.end_time) : undefined,
          breakMinutes: shift?.break_minutes,
          project_id: shift?.project_id ?? undefined,
          site_id: shift?.site_id ?? undefined,
          shift_id: shift?.id,
        }} />
    </div>
  );
}
