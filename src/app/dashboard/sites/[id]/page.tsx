import Link from "next/link";
import { requireOrgContext } from "@/lib/auth/context";
import { getSite, siteToday, listSiteAssignments } from "@/features/sites/queries";
import { memberMap, memberLabel } from "@/features/shared/members";
import { Panel, Metric } from "@/components/dashboard/primitives";
import { DescriptionList, ActionLink } from "@/components/dashboard/entity";
import { DataTable } from "@/components/dashboard/data-table";
import { ProjectBadge } from "@/lib/domain/badges";
import { formatAddress, type Address } from "@/lib/domain/address";
import { formatDateUK, hhmm } from "@/lib/dates";

export default async function SiteOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const [site, today, assignments, mmap] = await Promise.all([getSite(ctx, id), siteToday(ctx, id), listSiteAssignments(ctx, id), memberMap(ctx)]);
  if (!site) return null;
  const { data: projects } = await ctx.supabase.from("projects").select("id, project_number, name, status").eq("site_id", id).is("archived_at", null).order("created_at", { ascending: false });
  const contact = site.client_contacts as unknown as { first_name: string; last_name: string; email: string | null; mobile: string | null; phone: string | null } | null;
  const empName = (a: (typeof assignments)[number]) => {
    const e = a.employees as unknown as { first_name: string; last_name: string } | null;
    return e ? `${e.first_name} ${e.last_name}` : memberLabel(mmap.get(a.user_id));
  };
  const onShift = today.shifts.length;
  const loggedHours = today.timesheets.reduce((n, t) => n + Number(t.hours), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Team assigned" value={assignments.length} href={`/dashboard/sites/${id}/staff`} />
        <Metric label="On shift today" value={onShift} />
        <Metric label="Hours logged today" value={loggedHours.toFixed(2)} />
        <Metric label="Projects here" value={projects?.length ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Today" action={<ActionLink href={`/dashboard/rota?site=${id}`} className="h-8 px-3 text-xs">Open rota</ActionLink>}>
            {today.shifts.length ? (
              <ul className="divide-y divide-graphite/10 text-sm">
                {today.shifts.map((s) => {
                  const a = assignments.find((x) => x.employee_id === s.employee_id);
                  return (
                    <li key={s.id} className="flex items-center justify-between gap-3 py-2 first:pt-0">
                      <span>{a ? empName(a) : "Team member"}</span>
                      <span className="num-lining text-muted-light">{hhmm(s.start_time)}–{hhmm(s.end_time)} · {Number(s.hours).toFixed(2)}h</span>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="text-sm text-muted-light">Nobody is scheduled here today.</p>}
          </Panel>

          <Panel title="Location">
            <DescriptionList items={[
              { label: "Address", value: formatAddress(site.address as Address) || null },
              { label: "Postcode", value: site.postcode },
              { label: "Opened", value: site.opened_on ? formatDateUK(site.opened_on) : null },
              { label: "Access details", value: site.access_details },
              { label: "Notes", value: site.notes },
            ]} />
          </Panel>

          <Panel title="Projects at this site">
            <DataTable rows={projects ?? []} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/projects/${r.id}`}
              columns={[
                { key: "name", header: "Project", render: (r) => r.name },
                { key: "n", header: "Number", render: (r) => r.project_number },
                { key: "s", header: "Status", render: (r) => <ProjectBadge status={r.status} /> },
              ]}
              empty={{ title: "No projects here yet" }} />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Our manager">
            {site.oar_manager_id
              ? <p className="text-sm">{memberLabel(mmap.get(site.oar_manager_id))}</p>
              : <p className="text-sm text-muted-light">Nobody is accountable for this site yet. Set a manager on the Edit screen.</p>}
          </Panel>
          <Panel title="Client site manager">
            {site.site_manager_name ? (
              <DescriptionList cols={1} items={[
                { label: "Name", value: site.site_manager_name },
                { label: "Email", value: site.site_manager_email },
                { label: "Phone", value: site.site_manager_phone },
              ]} />
            ) : <p className="text-sm text-muted-light">Not recorded.</p>}
          </Panel>
          <Panel title="Client contact">
            {contact ? (
              <DescriptionList cols={1} items={[
                { label: "Name", value: `${contact.first_name} ${contact.last_name}`.trim() },
                { label: "Email", value: contact.email },
                { label: "Phone", value: contact.mobile ?? contact.phone },
              ]} />
            ) : <p className="text-sm text-muted-light">None set. <Link href={`/dashboard/sites/${id}/edit`} className="underline">Add one</Link>.</p>}
          </Panel>
        </div>
      </div>
    </div>
  );
}
