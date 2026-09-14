import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listClientOptions, listProjectOptions } from "@/features/shared/lookups";
import { listContacts } from "@/features/clients/queries";
import { getLead } from "@/features/leads/queries";
import { EntityHeader } from "@/components/dashboard/entity";
import { QuoteHeaderForm } from "@/components/dashboard/forms/quote-forms";
import { str } from "@/lib/pagination";

export const metadata = { title: "New quote" };

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/quotes/new");
  if (!ctx.can("sales.write")) redirect("/dashboard/quotes");
  const sp = await searchParams;
  const leadId = str(sp.lead) || undefined;
  const lead = leadId ? await getLead(ctx, leadId) : null;
  const clientId = str(sp.client) || lead?.client_id || undefined;
  const [clients, projects, contacts] = await Promise.all([listClientOptions(ctx), listProjectOptions(ctx), clientId ? listContacts(ctx, clientId) : Promise.resolve([])]);
  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: "/dashboard/quotes", label: "Quotes" }} eyebrow="Sales" title="New quotation" />
      {lead && !lead.client_id ? <p className="mb-6 rounded-md bg-status-warning/10 px-4 py-3 text-sm">This lead has no client linked yet — select or create the client below.</p> : null}
      <QuoteHeaderForm clients={clients} projects={projects} contacts={contacts.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}`.trim() }))} defaults={{ client_id: clientId, lead_id: leadId, project_id: str(sp.project) || lead?.converted_project_id || undefined, title: lead?.title }} />
    </div>
  );
}
