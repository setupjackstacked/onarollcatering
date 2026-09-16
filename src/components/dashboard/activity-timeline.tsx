import { RelativeTime } from "./relative-time";
import { EmptyState } from "./primitives";

export type ActivityRow = { id: string; action: string; created_at: string; metadata: Record<string, unknown>; user?: { full_name: string | null; email: string | null } | null };

const LABELS: Record<string, (m: Record<string, unknown>) => string> = {
  "leads.created": () => "Lead created",
  "leads.status_changed": (m) => `Status changed from ${pretty(m.from)} to ${pretty(m.to)}`,
  "leads.archived": () => "Lead archived",
  "projects.created": () => "Project created",
  "projects.status_changed": (m) => `Status changed from ${pretty(m.from)} to ${pretty(m.to)}`,
  "projects.archived": () => "Project archived",
  "enquiries.converted": () => "Enquiry converted to lead",
  "note.added": () => "Note added",
  "document.uploaded": (m) => `Document uploaded${m.name ? ` — ${m.name}` : ""}`,
  "client.updated": () => "Client details updated",
  "client.archived": () => "Client archived",
  "contact.added": () => "Contact added",
  "site.added": () => "Site added",
  "task.completed": () => "Task completed",
  "quotes.created": () => "Quote created",
  "quotes.sent": () => "Quote sent",
  "quotes.accepted": () => "Quote accepted",
  "quotes.rejected": () => "Quote rejected",
  "invoices.issued": () => "Invoice issued",
  "invoices.payment_recorded": (m) => `Payment recorded${m.amount ? ` — €${m.amount}` : ""}`,
  "timesheets.approved": () => "Timesheet approved",
};

function pretty(v: unknown) {
  return typeof v === "string" ? v.replace(/_/g, " ") : "—";
}

export function ActivityTimeline({ rows }: { rows: ActivityRow[] }) {
  if (!rows.length) return <EmptyState title="No activity yet" description="Changes to this record are logged here automatically." />;
  return (
    <ol className="relative space-y-0 border-l border-graphite/15 pl-5">
      {rows.map((r) => {
        const label = LABELS[r.action]?.(r.metadata) ?? r.action.replace(/[._]/g, " ");
        const who = r.user?.full_name ?? r.user?.email ?? "System";
        return (
          <li key={r.id} className="relative pb-5 last:pb-0">
            <span aria-hidden className="absolute -left-[1.4rem] top-1.5 size-2 rounded-full bg-copper ring-4 ring-ivory" />
            <p className="text-sm">{label}</p>
            <p className="text-xs text-muted-light">
              {who} · <RelativeTime value={r.created_at} />
            </p>
          </li>
        );
      })}
    </ol>
  );
}
