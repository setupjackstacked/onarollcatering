import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getTask } from "@/features/tasks/queries";
import { deleteTask } from "@/features/tasks/actions";
import { listMembers, memberOptions } from "@/features/shared/members";
import { listProjectOptions } from "@/features/shared/lookups";
import { EntityHeader } from "@/components/dashboard/entity";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { TaskForm } from "@/components/dashboard/forms/task-form";
import { str } from "@/lib/pagination";
import { safeNext } from "@/lib/validation/auth";

export default async function EditTaskPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await requireOrgContext();
  const returnTo = safeNext(str(sp.return), "/dashboard/tasks");
  const [task, members, projects] = await Promise.all([getTask(ctx, id), listMembers(ctx), listProjectOptions(ctx)]);
  if (!task) notFound();
  return (
    <div className="max-w-2xl">
      <EntityHeader back={{ href: returnTo, label: "Back" }} eyebrow="Task" title={task.title} actions={ctx.can("projects.write") ? <ConfirmAction action={async () => { "use server"; await deleteTask(id, returnTo); }} label="Delete" title="Delete this task?" confirmLabel="Delete" /> : null} />
      <TaskForm task={task} projects={projects} members={memberOptions(members)} returnTo={returnTo} />
    </div>
  );
}
