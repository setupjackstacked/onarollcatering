import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getProject, projectCounts } from "@/features/projects/queries";
import { archiveProject } from "@/features/projects/actions";
import { EntityHeader, ActionLink } from "@/components/dashboard/entity";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { ProjectBadge } from "@/lib/domain/badges";
import { ProjectTabs } from "./tabs";

export default async function ProjectLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/projects/${id}`);
  if (!ctx.can("projects.read")) redirect("/dashboard");
  const project = await getProject(ctx, id);
  if (!project) notFound();
  const counts = await projectCounts(ctx, id);
  const client = project.clients as unknown as { id: string; name: string } | null;
  const canWrite = ctx.can("projects.write") || (ctx.role === "project_manager" && project.project_manager_id === ctx.user.id);
  const base = `/dashboard/projects/${id}`;
  return (
    <>
      <EntityHeader
        back={{ href: "/dashboard/projects", label: "Projects" }}
        eyebrow={`Project ${project.project_number}`}
        title={project.name}
        badge={<ProjectBadge status={project.status} />}
        meta={<>{client ? <Link href={`/dashboard/clients/${client.id}`} className="underline">{client.name}</Link> : null}{project.sites ? <span>{(project.sites as unknown as { name: string }).name}</span> : null}</>}
        actions={
          <>
            {canWrite ? <ActionLink href={`${base}/edit`}>Edit</ActionLink> : null}
            {ctx.can("projects.write") ? <ConfirmAction action={archiveProject.bind(null, id)} label="Archive" title="Archive this project?" description="Hidden from lists; financial records are retained." confirmLabel="Archive" /> : null}
          </>
        }
      />
      <ProjectTabs base={base} counts={counts} />
      {children}
    </>
  );
}
