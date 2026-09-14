import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listTasks } from "@/features/tasks/queries";
import { listMembers, memberOptions, memberMap } from "@/features/shared/members";
import { PageHeader } from "@/components/dashboard/primitives";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ActionLink } from "@/components/dashboard/entity";
import { TaskList } from "@/components/dashboard/task-list";

export const metadata = { title: "Tasks" };

export default async function TasksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/tasks");
  if (!ctx.can("projects.read") && ctx.role !== "staff") redirect("/dashboard");
  const sp = await searchParams;
  const [{ rows }, members, mmap] = await Promise.all([listTasks(ctx, sp), listMembers(ctx), memberMap(ctx)]);
  return (
    <>
      <PageHeader eyebrow="Projects" title="Tasks" actions={<ActionLink href="/dashboard/tasks/new" variant="copper">New task</ActionLink>} />
      <FilterBar
        filters={[
          { name: "status", label: "All open", options: [{ value: "todo", label: "To do" }, { value: "in_progress", label: "In progress" }, { value: "blocked", label: "Blocked" }, { value: "complete", label: "Complete" }] },
          { name: "assignee", label: "Anyone", options: [{ value: "me", label: "Mine" }, ...memberOptions(members)] },
        ]}
        searchPlaceholder="Task title"
      />
      <TaskList rows={rows} members={mmap} revalidate="/dashboard/tasks" editBase="/dashboard/tasks" />
    </>
  );
}
