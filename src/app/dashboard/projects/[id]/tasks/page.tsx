import { requireOrgContext } from "@/lib/auth/context";
import { listTasks } from "@/features/tasks/queries";
import { memberMap } from "@/features/shared/members";
import { TaskList } from "@/components/dashboard/task-list";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ActionLink } from "@/components/dashboard/entity";

export default async function ProjectTasksPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await requireOrgContext();
  const [{ rows }, members] = await Promise.all([listTasks(ctx, sp, id), memberMap(ctx)]);
  const path = `/dashboard/projects/${id}/tasks`;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar showSearch={false} filters={[{ name: "status", label: "All open", options: [{ value: "todo", label: "To do" }, { value: "in_progress", label: "In progress" }, { value: "blocked", label: "Blocked" }, { value: "complete", label: "Complete" }] }]} />
        <ActionLink href={`/dashboard/tasks/new?project=${id}&return=${encodeURIComponent(path)}`} variant="copper">Add task</ActionLink>
      </div>
      <TaskList rows={rows} members={members} revalidate={path} editBase="/dashboard/tasks" showProject={false} />
    </div>
  );
}
