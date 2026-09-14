import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listClientOptions, listProjectOptions } from "@/features/shared/lookups";
import { listContacts } from "@/features/clients/queries";
import { EntityHeader } from "@/components/dashboard/entity";
import { InvoiceHeaderForm } from "@/components/dashboard/forms/invoice-forms";
import { str } from "@/lib/pagination";

export const metadata = { title: "New invoice" };

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/invoices/new");
  if (!ctx.can("finance.write")) redirect("/dashboard/invoices");
  const sp = await searchParams;
  const clientId = str(sp.client) || undefined;
  const [clients, projects, contacts] = await Promise.all([listClientOptions(ctx), listProjectOptions(ctx), clientId ? listContacts(ctx, clientId) : Promise.resolve([])]);
  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: "/dashboard/invoices", label: "Invoices" }} eyebrow="Finance" title="New invoice" />
      <p className="mb-6 text-sm text-muted-light">Tip: invoices raised from an accepted quote carry the quote lines across automatically — open the quote and use “Create draft invoice”.</p>
      <InvoiceHeaderForm clients={clients} projects={projects} contacts={contacts.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}`.trim() }))} defaults={{ client_id: clientId, project_id: str(sp.project) || undefined }} />
    </div>
  );
}
