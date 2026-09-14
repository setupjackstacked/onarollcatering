import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listMembers, memberOptions } from "@/features/shared/members";
import { listClientOptions, listSiteOptions, listServiceTypes } from "@/features/shared/lookups";
import { EntityHeader } from "@/components/dashboard/entity";
import { ProjectForm } from "@/components/dashboard/forms/project-form";
import { str } from "@/lib/pagination";

export const metadata = { title: "New project" };

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/projects/new");
  if (!ctx.can("projects.write")) redirect("/dashboard/projects");
  const sp = await searchParams;
  const clientId = str(sp.client) || undefined;
  const [members, clients, sites, services] = await Promise.all([listMembers(ctx), listClientOptions(ctx), listSiteOptions(ctx, clientId), listServiceTypes(ctx)]);
  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: "/dashboard/projects", label: "Projects" }} eyebrow="Projects" title="New project" />
      <ProjectForm clients={clients} sites={sites} members={memberOptions(members)} services={services.map((s) => ({ value: s.key, label: s.label }))} defaults={{ client_id: clientId }} />
    </div>
  );
}
