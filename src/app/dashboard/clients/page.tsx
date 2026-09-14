import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listClients } from "@/features/clients/queries";
import { memberMap, memberLabel } from "@/features/shared/members";
import { PageHeader } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ActionLink } from "@/components/dashboard/entity";
import { pageHref } from "@/lib/query-string";

export const metadata = { title: "Clients" };
type SP = Record<string, string | string[] | undefined>;

export default async function ClientsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireOrgContext("/dashboard/clients");
  if (!ctx.can("sales.read")) redirect("/dashboard");
  const sp = await searchParams;
  const [{ rows, total, page, size }, mmap] = await Promise.all([listClients(ctx, sp), memberMap(ctx)]);
  return (
    <>
      <PageHeader eyebrow="Sales" title="Clients" actions={ctx.can("sales.write") ? <ActionLink href="/dashboard/clients/new" variant="copper">New client</ActionLink> : null} />
      <FilterBar filters={[{ name: "archived", label: "Active", options: [{ value: "1", label: "Archived" }] }]} searchPlaceholder="Company name" />
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        rowHref={(r) => `/dashboard/clients/${r.id}`}
        columns={[
          { key: "name", header: "Client", render: (r) => r.name },
          { key: "email", header: "Email", render: (r) => r.email ?? "—" },
          { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
          { key: "terms", header: "Terms", render: (r) => `${r.payment_terms_days} days` },
          { key: "owner", header: "Account owner", render: (r) => memberLabel(r.owner_user_id ? mmap.get(r.owner_user_id) : null) },
        ]}
        empty={{ title: "No clients yet", description: "Clients are created here or automatically when an enquiry is converted.", action: ctx.can("sales.write") ? { label: "New client", href: "/dashboard/clients/new" } : undefined }}
        pagination={{ page, size, total, hrefFor: pageHref("/dashboard/clients", sp) }}
      />
    </>
  );
}
