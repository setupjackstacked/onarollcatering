import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listMembers, memberOptions } from "@/features/shared/members";
import { listLeadSources, listServiceTypes, listClientOptions } from "@/features/shared/lookups";
import { EntityHeader } from "@/components/dashboard/entity";
import { LeadForm } from "@/components/dashboard/forms/lead-form";

export const metadata = { title: "New lead" };

export default async function NewLeadPage() {
  const ctx = await requireOrgContext("/dashboard/leads/new");
  if (!ctx.can("sales.write")) redirect("/dashboard/leads");
  const [members, sources, services, clients] = await Promise.all([listMembers(ctx), listLeadSources(ctx), listServiceTypes(ctx), listClientOptions(ctx)]);
  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: "/dashboard/leads", label: "Leads" }} eyebrow="Sales" title="New lead" />
      <LeadForm clients={clients} members={memberOptions(members)} sources={sources.map((s) => ({ value: s.key, label: s.label }))} services={services.map((s) => ({ value: s.key, label: s.label }))} contacts={[]} />
    </div>
  );
}
