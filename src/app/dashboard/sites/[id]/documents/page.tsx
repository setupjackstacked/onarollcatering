import { requireOrgContext } from "@/lib/auth/context";
import { listEntityDocuments, documentCategories } from "@/features/documents/queries";
import { Panel } from "@/components/dashboard/primitives";
import { DocumentsPanel } from "@/components/dashboard/documents";

export default async function SiteDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const [docs, categories] = await Promise.all([listEntityDocuments(ctx, "site", id), documentCategories(ctx, "site")]);
  const canWrite = ctx.can("sites.write") || ctx.can("sales.write") || ctx.can("org.manage");
  return (
    <Panel title="Site documents">
      <p className="mb-4 text-sm text-muted-light">Contracts, risk assessments, method statements and induction paperwork for this site. Visible to everyone assigned here.</p>
      <DocumentsPanel entityType="site" entityId={id} documents={docs} categories={categories} canWrite={canWrite} revalidate={`/dashboard/sites/${id}/documents`} showExpiry />
    </Panel>
  );
}
