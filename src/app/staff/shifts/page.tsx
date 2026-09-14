import { requireStaff, myShifts } from "@/features/staff/queries";
import { ShiftCard, type StaffShift } from "@/components/staff/cards";
import { isoDateOffset } from "@/lib/dates";

export const metadata = { title: "Shifts" };

export default async function StaffShiftsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, employee } = await requireStaff("/staff/shifts");
  const past = (await searchParams).past === "1";
  const range = past ? { from: isoDateOffset(-60), to: isoDateOffset(-1) } : { from: isoDateOffset(0), to: isoDateOffset(90) };
  const shifts = await myShifts(ctx, employee.id, range);
  const ordered = past ? [...shifts].reverse() : shifts;
  const total = shifts.reduce((n, s) => n + Number(s.hours), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display display-sm">{past ? "Past shifts" : "Your shifts"}</h1>
        <a href={past ? "/staff/shifts" : "/staff/shifts?past=1"} className="text-sm underline">{past ? "Upcoming" : "Past 60 days"}</a>
      </div>
      <p className="text-sm text-muted-light">{shifts.length} shift{shifts.length === 1 ? "" : "s"} · {total.toFixed(2)} hours</p>
      {ordered.length ? (
        <div className="space-y-3">
          {ordered.map((s) => <ShiftCard key={s.id} shift={s as unknown as StaffShift} />)}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-graphite/20 px-4 py-8 text-center text-sm text-muted-light">{past ? "No shifts in the last 60 days." : "Nothing scheduled yet. Your manager publishes shifts to the rota."}</p>
      )}
    </div>
  );
}
