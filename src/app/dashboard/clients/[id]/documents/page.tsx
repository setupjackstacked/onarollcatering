import { requireOrgContext } from "@/lib/auth/context";
import { listEntityDocuments, documentCategories } from "@/features/documents/queries";
import { DocumentsPanel } from "@/components/dashboard/documents";

export default async function ClientDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const [docs, cats] = await Promise.all([listEntityDocuments(ctx, "client", id), documentCategories(ctx, "client")]);
  return <DocumentsPanel entityType="client" entityId={id} documents={docs} categories={cats} canWrite={ctx.can("sales.write")} revalidate={`/dashboard/clients/${id}/documents`} />;
}
