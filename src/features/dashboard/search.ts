"use server";

import { requireOrgContext } from "@/lib/auth/context";

export type SearchGroup = { entity: "clients" | "contacts" | "projects" | "leads" | "sites"; label: string; results: SearchHit[] };
export type SearchHit = { id: string; title: string; subtitle?: string; href: string };

const MIN = 2;

/**
 * Global ⌘K search. Plain PostgreSQL ilike through the RLS-scoped client, so
 * results are automatically limited to what the user may see. Grouped by entity.
 * Hrefs point at Phase 4 routes; until those exist the palette shows results
 * but marks them "opens in Phase 4".
 */
export async function searchDashboard(rawQuery: string): Promise<SearchGroup[]> {
  const q = rawQuery.trim().slice(0, 80);
  if (q.length < MIN) return [];
  const { supabase } = await requireOrgContext();
  const like = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;

  const [clients, contacts, projects, leads, sites] = await Promise.all([
    supabase.from("clients").select("id, name, email").is("archived_at", null).ilike("name", like).limit(5),
    supabase.from("client_contacts").select("id, first_name, last_name, email, client_id, clients(name)").is("archived_at", null).or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like}`).limit(5),
    supabase.from("projects").select("id, name, project_number, status").is("archived_at", null).or(`name.ilike.${like},project_number.ilike.${like}`).limit(5),
    supabase.from("leads").select("id, title, status, company_name").is("archived_at", null).or(`title.ilike.${like},company_name.ilike.${like}`).limit(5),
    supabase.from("sites").select("id, name, postcode, client_id").is("archived_at", null).or(`name.ilike.${like},postcode.ilike.${like}`).limit(5),
  ]);

  const groups: SearchGroup[] = [
    {
      entity: "clients",
      label: "Clients",
      results: (clients.data ?? []).map((c) => ({ id: c.id, title: c.name, subtitle: c.email ?? undefined, href: `/dashboard/clients/${c.id}` })),
    },
    {
      entity: "contacts",
      label: "Contacts",
      results: (contacts.data ?? []).map((c) => ({
        id: c.id,
        title: `${c.first_name} ${c.last_name}`.trim(),
        subtitle: (c.clients as unknown as { name: string } | null)?.name ?? c.email ?? undefined,
        href: `/dashboard/clients/${c.client_id}?contact=${c.id}`,
      })),
    },
    {
      entity: "projects",
      label: "Projects",
      results: (projects.data ?? []).map((p) => ({ id: p.id, title: p.name, subtitle: p.project_number, href: `/dashboard/projects/${p.id}` })),
    },
    {
      entity: "leads",
      label: "Leads",
      results: (leads.data ?? []).map((l) => ({ id: l.id, title: l.title, subtitle: l.company_name ?? undefined, href: `/dashboard/leads/${l.id}` })),
    },
    {
      entity: "sites",
      label: "Sites",
      results: (sites.data ?? []).map((s) => ({ id: s.id, title: s.name, subtitle: s.postcode ?? undefined, href: `/dashboard/sites/${s.id}` })),
    },
  ];
  return groups.filter((g) => g.results.length > 0);
}
