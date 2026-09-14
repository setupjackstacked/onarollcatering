import Link from "next/link";
import { MapPin } from "lucide-react";
import { formatDateUK, hhmm } from "@/lib/dates";
import { formatAddress, type Address } from "@/lib/domain/address";
import { cn } from "@/lib/utils/cn";

export type StaffShift = {
  id: string; shift_date: string; start_time: string; end_time: string; break_minutes: number; hours: string; notes: string | null;
  projects?: unknown; sites?: unknown;
};

/** One shift, readable at arm's length on a phone. */
export function ShiftCard({ shift, highlight }: { shift: StaffShift; highlight?: boolean }) {
  const project = shift.projects as { name: string; project_number: string } | null;
  const site = shift.sites as { name: string; address: Address; postcode: string | null; access_details: string | null } | null;
  const address = site ? [formatAddress(site.address), site.postcode].filter(Boolean).join(", ") : null;
  return (
    <article className={cn("rounded-lg border p-4", highlight ? "border-copper/40 bg-copper/[0.06]" : "border-graphite/10 bg-white/50")}>
      <p className="text-xs uppercase tracking-wider text-muted-light">{formatDateUK(shift.shift_date)}</p>
      <p className="font-display num-lining mt-1 text-2xl">{hhmm(shift.start_time)} – {hhmm(shift.end_time)}</p>
      <p className="mt-1 text-sm text-muted-light">{Number(shift.hours).toFixed(2)} paid hours{shift.break_minutes ? ` · ${shift.break_minutes} min break` : ""}</p>
      {project ? <p className="mt-3 text-sm font-medium">{project.name}</p> : null}
      {site ? (
        <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-light">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {site.name}{address ? <span className="block">{address}</span> : null}
            {address ? <Link href={`https://maps.google.com/?q=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer" className="underline">Open in maps</Link> : null}
          </span>
        </p>
      ) : null}
      {site?.access_details ? <p className="mt-2 rounded-md bg-graphite/5 px-3 py-2 text-xs">Access: {site.access_details}</p> : null}
      {shift.notes ? <p className="mt-2 text-sm">{shift.notes}</p> : null}
    </article>
  );
}
