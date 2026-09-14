import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getProject } from "@/features/projects/queries";
import { listMembers, memberOptions } from "@/features/shared/members";
import { listClientOptions, listSiteOptions, listServiceTypes } from "@/features/shared/lookups";
import { ProjectForm } from "@/components/dashboard/forms/project-form";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const project = await getProject(ctx, id);
  if (!project) notFound();
  const canWrite = ctx.can("projects.write") || (ctx.role === "project_manager" && project.project_manager_id === ctx.user.id);
  if (!canWrite) redirect(`/dashboard/projects/${id}`);
  const [members, clients, sites, services] = await Promise.all([listMembers(ctx), listClientOptions(ctx), listSiteOptions(ctx, project.client_id), listServiceTypes(ctx)]);
  return <div className="max-w-3xl"><ProjectForm project={project} clients={clients} sites={sites} members={memberOptions(members)} services={services.map((s) => ({ value: s.key, label: s.label }))} /></div>;
}
