import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { EntityHeader, DescriptionList, ActionLink } from "@/components/dashboard/entity";
import { Panel } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { ProjectBadge } from "@/lib/domain/badges";
import { formatAddress, type Address } from "@/lib/domain/address";

export default async function SitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/sites/${id}`);
  const { data: site } = await ctx.supabase.from("sites").select("*, clients(id, name), client_contacts(first_name, last_name, email, mobile, phone)").eq("id", id).maybeSingle();
  if (!site) notFound();
  const { data: projects } = await ctx.supabase.from("projects").select("id, project_number, name, status").eq("site_id", id).is("archived_at", null).order("created_at", { ascending: false });
  const client = site.clients as unknown as { id: string; name: string };
  const contact = site.client_contacts as unknown as { first_name: string; last_name: string; email: string | null; mobile: string | null; phone: string | null } | null;
  return (
    <>
      <EntityHeader back={{ href: "/dashboard/sites", label: "Sites" }} eyebrow="Site" title={site.name} meta={<Link href={`/dashboard/clients/${client.id}`} className="underline">{client.name}</Link>} actions={<ActionLink href={`/dashboard/clients/${client.id}/sites?edit=${id}`}>Edit</ActionLink>} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Location">
            <DescriptionList items={[{ label: "Address", value: formatAddress(site.address as Address) || null }, { label: "Postcode", value: site.postcode }, { label: "Access details", value: site.access_details }, { label: "Notes", value: site.notes }]} />
          </Panel>
          <Panel title="Projects at this site">
            <DataTable rows={projects ?? []} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/projects/${r.id}`} columns={[{ key: "name", header: "Project", render: (r) => r.name }, { key: "n", header: "Number", render: (r) => r.project_number }, { key: "s", header: "Status", render: (r) => <ProjectBadge status={r.status} /> }]} empty={{ title: "No projects here yet" }} />
          </Panel>
        </div>
        <Panel title="Site contact">
          {contact ? <DescriptionList cols={1} items={[{ label: "Name", value: `${contact.first_name} ${contact.last_name}`.trim() }, { label: "Email", value: contact.email }, { label: "Phone", value: contact.mobile ?? contact.phone }]} /> : <p className="text-sm text-muted-light">None set.</p>}
        </Panel>
      </div>
    </>
  );
}
