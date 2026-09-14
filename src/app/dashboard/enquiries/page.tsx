import Link from "next/link";
import { requireOrgContext } from "@/lib/auth/context";
import { listEnquiries, enquiryCounts } from "@/features/enquiries/queries";
import { PageHeader } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { EnquiryBadge } from "@/lib/domain/badges";
import { formatDateUK } from "@/lib/dates";
import { SERVICE_OPTIONS } from "@/lib/validation/enquiry";
import { redirect } from "next/navigation";

export const metadata = { title: "Enquiries" };
type SP = Record<string, string | string[] | undefined>;

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireOrgContext("/dashboard/enquiries");
  if (!ctx.can("sales.read")) redirect("/dashboard");
  const sp = await searchParams;
  const [{ rows, total, page, size }, counts] = await Promise.all([listEnquiries(ctx, sp), enquiryCounts(ctx)]);
  const svc = (k: string) => SERVICE_OPTIONS.find((o) => o.value === k)?.label ?? k;
  const qs = (p: number) => { const n = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : []))); n.set("page", String(p)); return `/dashboard/enquiries?${n}`; };

  return (
    <>
      <PageHeader eyebrow="Sales" title="Enquiries" description="Everything submitted through the website quote form. Convert good ones into leads." />
      <FilterBar
        filters={[{ name: "status", label: "New", options: [
          { value: "new", label: `New (${counts.new ?? 0})` }, { value: "reviewed", label: `Reviewed (${counts.reviewed ?? 0})` }, { value: "converted", label: `Converted (${counts.converted ?? 0})` },
          { value: "spam", label: "Spam" }, { value: "archived", label: "Archived" }, { value: "all", label: "All" },
        ] }]}
        searchPlaceholder="Company, project or contact"
      />
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        rowHref={(r) => `/dashboard/enquiries/${r.id}`}
        columns={[
          { key: "company", header: "Company", render: (r) => r.company_name },
          { key: "project", header: "Project", render: (r) => r.project_name },
          { key: "services", header: "Services", render: (r) => r.services.map(svc).join(", ") },
          { key: "location", header: "Location", render: (r) => r.location },
          { key: "status", header: "Status", render: (r) => <EnquiryBadge status={r.status} /> },
          { key: "received", header: "Received", render: (r) => formatDateUK(r.created_at) },
        ]}
        empty={{ title: "No enquiries here", description: "New website enquiries appear in this inbox." }}
        pagination={{ page, size, total, hrefFor: qs }}
      />
      <p className="mt-4 text-xs text-muted-light">
        Leads created from enquiries are in <Link href="/dashboard/leads" className="underline">Leads</Link>.
      </p>
    </>
  );
}
