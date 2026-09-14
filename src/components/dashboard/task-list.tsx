import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { setTaskStatus } from "@/features/tasks/actions";
import { TASK_STATUS_LABEL, TASK_PRIORITY_LABEL } from "@/features/tasks/schema";
import { StatusBadge, EmptyState } from "@/components/dashboard/primitives";
import { formatDateUK, isoDateOffset } from "@/lib/dates";
import { cn } from "@/lib/utils/cn";

type Row = { id: string; title: string; status: string; priority: string; due_date: string | null; assignee_user_id: string | null; project_id: string | null; projects?: { name: string; project_number: string } | null };

export function TaskList({ rows, members, revalidate, editBase, showProject = true }: { rows: Row[]; members: Map<string, { full_name: string | null; email: string | null }>; revalidate: string; editBase: string; showProject?: boolean }) {
  if (!rows.length) return <EmptyState title="No tasks" description="Nothing to do here right now." />;
  const today = isoDateOffset(0);
  const tone = (p: string) => (p === "urgent" ? "red" : p === "high" ? "amber" : "grey");
  return (
    <ul className="divide-y divide-graphite/10 rounded-lg border border-graphite/10 bg-white/40">
      {rows.map((t) => {
        const done = t.status === "complete";
        const overdue = !done && t.due_date && t.due_date < today;
        const toggle = setTaskStatus.bind(null, t.id, done ? "todo" : "complete", revalidate);
        return (
          <li key={t.id} className="flex items-start gap-3 px-4 py-3">
            <form action={toggle}>
              <button type="submit" aria-label={done ? "Mark not done" : "Mark complete"} className="mt-0.5 text-muted-light hover:text-copper-dark">
                {done ? <CheckCircle2 className="size-5 text-status-success" /> : <Circle className="size-5" />}
              </button>
            </form>
            <div className="min-w-0 flex-1">
              <Link href={`${editBase}/${t.id}${editBase.includes("?") ? "&" : "?"}return=${encodeURIComponent(revalidate)}`} className={cn("block text-sm font-medium hover:underline", done && "text-muted-light line-through")}>{t.title}</Link>
              <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-light">
                {showProject && t.projects ? <span>{t.projects.project_number} · {t.projects.name}</span> : null}
                {t.assignee_user_id ? <span>{members.get(t.assignee_user_id)?.full_name ?? members.get(t.assignee_user_id)?.email}</span> : <span>Unassigned</span>}
                {t.due_date ? <span className={cn(overdue && "text-status-danger")}>Due {formatDateUK(t.due_date)}{overdue ? " · overdue" : ""}</span> : null}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {t.status !== "todo" && !done ? <StatusBadge label={TASK_STATUS_LABEL[t.status as keyof typeof TASK_STATUS_LABEL]} tone={t.status === "blocked" ? "red" : "blue"} /> : null}
              {t.priority !== "medium" && t.priority !== "low" ? <StatusBadge label={TASK_PRIORITY_LABEL[t.priority as keyof typeof TASK_PRIORITY_LABEL]} tone={tone(t.priority)} /> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
