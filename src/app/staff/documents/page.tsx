import { requireStaff, myDocuments } from "@/features/staff/queries";
import { documentCategories } from "@/features/documents/queries";
import { VerificationBadge } from "@/lib/domain/badges";
import { formatDateUK, isoDateOffset } from "@/lib/dates";

export const metadata = { title: "Documents" };

export default async function StaffDocumentsPage() {
  const { ctx, employee } = await requireStaff("/staff/documents");
  const [docs, categories] = await Promise.all([myDocuments(ctx, employee.id), documentCategories(ctx, "employee")]);
  const today = isoDateOffset(0), soon = isoDateOffset(30);
  const label = (k: string) => categories.find((c) => c.key === k)?.label ?? k;
  const expiring = docs.filter((d) => d.expiry_date && d.expiry_date <= soon);

  return (
    <div className="space-y-5">
      <h1 className="font-display display-sm">Your documents</h1>
      <p className="text-sm text-muted-light">Right to work, food hygiene and training certificates your manager holds for you.</p>

      {expiring.length ? (
        <p className="rounded-md bg-status-warning/10 px-4 py-3 text-sm">
          {expiring.length} document{expiring.length === 1 ? " needs" : "s need"} renewing soon. Send the replacement to your manager — an expired document stops you being scheduled.
        </p>
      ) : null}

      {docs.length ? (
        <ul className="space-y-3">
          {docs.map((d) => {
            const expired = d.expiry_date && d.expiry_date < today;
            return (
              <li key={d.id} className="rounded-lg border border-graphite/10 bg-white/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <a href={`/api/documents/${d.id}`} className="font-medium underline">{d.name}</a>
                    <p className="text-xs text-muted-light">{label(d.category_key)}{d.expiry_date ? ` · expires ${formatDateUK(d.expiry_date)}` : ""}</p>
                  </div>
                  <VerificationBadge status={expired ? "expired" : d.verification} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-graphite/20 px-4 py-8 text-center text-sm text-muted-light">No documents on file. Your manager uploads these — send them anything they’ve asked for.</p>
      )}
    </div>
  );
}
