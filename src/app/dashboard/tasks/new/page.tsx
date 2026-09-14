import { requireOrgContext } from "@/lib/auth/context";
import { listMembers, memberOptions } from "@/features/shared/members";
import { listProjectOptions } from "@/features/shared/lookups";
import { EntityHeader } from "@/components/dashboard/entity";
import { TaskForm } from "@/components/dashboard/forms/task-form";
import { str } from "@/lib/pagination";
import { safeNext } from "@/lib/validation/auth";

export const metadata = { title: "New task" };

export default async function NewTaskPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/tasks/new");
  const sp = await searchParams;
  const returnTo = safeNext(str(sp.return), "/dashboard/tasks");
  const [members, projects] = await Promise.all([listMembers(ctx), listProjectOptions(ctx)]);
  return (
    <div className="max-w-2xl">
      <EntityHeader back={{ href: returnTo, label: "Back" }} eyebrow="Tasks" title="New task" />
      <TaskForm projects={projects} members={memberOptions(members)} defaults={{ project_id: str(sp.project) || undefined }} returnTo={returnTo} />
    </div>
  );
}
