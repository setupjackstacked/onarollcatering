import { requireOrgContext } from "@/lib/auth/context";
import { getProject } from "@/features/projects/queries";
import { listEntityDocuments, documentCategories } from "@/features/documents/queries";
import { DocumentsPanel } from "@/components/dashboard/documents";

export default async function ProjectDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const [project, docs, cats] = await Promise.all([getProject(ctx, id), listEntityDocuments(ctx, "project", id), documentCategories(ctx, "project")]);
  const canWrite = !!project && (ctx.can("projects.write") || (ctx.role === "project_manager" && project.project_manager_id === ctx.user.id));
  return <DocumentsPanel entityType="project" entityId={id} documents={docs} categories={cats} canWrite={canWrite} revalidate={`/dashboard/projects/${id}/documents`} showExpiry />;
}
