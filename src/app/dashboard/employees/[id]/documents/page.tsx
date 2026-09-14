import { requireOrgContext } from "@/lib/auth/context";
import { listEmployeeDocuments } from "@/features/workforce/queries";
import { setDocumentVerification } from "@/features/workforce/actions";
import { documentCategories } from "@/features/documents/queries";
import { Panel } from "@/components/dashboard/primitives";
import { DocumentsPanel } from "@/components/dashboard/documents";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { VerificationBadge } from "@/lib/domain/badges";
import { formatDateUK, isoDateOffset } from "@/lib/dates";

export default async function EmployeeDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const [docs, categories] = await Promise.all([listEmployeeDocuments(ctx, id), documentCategories(ctx, "employee")]);
  const canWrite = ctx.can("workforce.write");
  const path = `/dashboard/employees/${id}/documents`;
  const today = isoDateOffset(0), soon = isoDateOffset(90);
  const label = (k: string) => categories.find((c) => c.key === k)?.label ?? k;
  return (
    <div className="space-y-6">
      <Panel title="Verification">
        {docs.length ? (
          <ul className="divide-y divide-graphite/10 text-sm">
            {docs.map((d) => {
              const expired = d.expiry_date && d.expiry_date < today;
              const expiring = d.expiry_date && !expired && d.expiry_date <= soon;
              return (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="min-w-0 flex-1">
                    <a href={`/api/documents/${d.id}`} className="font-medium underline">{d.name}</a>
                    <span className="block text-xs text-muted-light">
                      {label(d.category_key)}
                      {d.expiry_date ? <> · expires {formatDateUK(d.expiry_date)}</> : null}
                      {expired ? <span className="ml-2 text-status-danger">Expired</span> : expiring ? <span className="ml-2 text-status-warning">Expiring soon</span> : null}
                    </span>
                  </span>
                  <VerificationBadge status={expired ? "expired" : d.verification} />
                  {canWrite ? (
                    <span className="flex gap-1">
                      {d.verification !== "verified" ? <ConfirmAction action={setDocumentVerification.bind(null, d.id, "verified", id)} label="Verify" title={`Mark ${d.name} as verified?`} description="Confirms you have seen the original." confirmLabel="Verify" variant="outline" className="h-8 px-3 text-xs" /> : null}
                      {d.verification !== "rejected" ? <ConfirmAction action={setDocumentVerification.bind(null, d.id, "rejected", id)} label="Reject" title={`Reject ${d.name}?`} confirmLabel="Reject" className="h-8 px-3 text-xs" /> : null}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : <p className="text-sm text-muted-light">No compliance documents yet. Upload right to work, food hygiene and training certificates below, with expiry dates so you get warned before they lapse.</p>}
      </Panel>
      <Panel title="Documents">
        <DocumentsPanel entityType="employee" entityId={id} documents={docs} categories={categories} canWrite={canWrite} revalidate={path} showExpiry />
      </Panel>
    </div>
  );
}
