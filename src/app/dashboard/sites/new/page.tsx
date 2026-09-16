import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listClientOptions } from "@/features/shared/lookups";
import { listMembers, memberOptions } from "@/features/shared/members";
import { EntityHeader } from "@/components/dashboard/entity";
import { SiteForm } from "@/components/dashboard/forms/site-form";
import { NewSiteClientPicker } from "@/components/dashboard/forms/site-operations-forms";
import { str } from "@/lib/pagination";

export const metadata = { title: "Add site" };

export default async function NewSitePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/sites/new");
  if (!ctx.can("sales.write") && !ctx.can("projects.write")) redirect("/dashboard/sites");
  const sp = await searchParams;
  const clientId = str(sp.client);
  const [clients, members] = await Promise.all([listClientOptions(ctx), listMembers(ctx)]);
  const managers = memberOptions(members.filter((m) => ["owner", "administrator", "project_manager"].includes(m.role)));

  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: "/dashboard/sites", label: "Sites" }} eyebrow="Operations" title="Add site" />
      {clientId ? (
        <SiteForm clientId={clientId} contacts={[]} managers={managers} returnTo="/dashboard/sites" />
      ) : clients.length ? (
        <NewSiteClientPicker clients={clients} />
      ) : (
        <p className="rounded-md bg-status-warning/10 px-4 py-3 text-sm">Add a client first — every site belongs to one.</p>
      )}
    </div>
  );
}
