import "server-only";

import type { OrgContext } from "@/lib/auth/context";
import { pageParams, str } from "@/lib/pagination";

export async function listClients(ctx: OrgContext, sp: Record<string, string | string[] | undefined>) {
  const { from, to, page, size } = pageParams(sp);
  const q = str(sp.q);
  const archived = str(sp.archived) === "1";
  let query = ctx.supabase
    .from("clients")
    .select("id, name, email, phone, payment_terms_days, created_at, archived_at, owner_user_id", { count: "exact" })
    .eq("organisation_id", ctx.organisation.id)
    .order("name")
    .range(from, to);
  query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (q) query = query.ilike("name", `%${q}%`);
  const { data, count } = await query;
  return { rows: data ?? [], total: count ?? 0, page, size };
}

export async function getClient(ctx: OrgContext, id: string) {
  const { data } = await ctx.supabase.from("clients").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function clientCounts(ctx: OrgContext, id: string) {
  const [contacts, sites, projects, docs, leads] = await Promise.all([
    ctx.supabase.from("client_contacts").select("id", { count: "exact", head: true }).eq("client_id", id).is("archived_at", null),
    ctx.supabase.from("sites").select("id", { count: "exact", head: true }).eq("client_id", id).is("archived_at", null),
    ctx.supabase.from("projects").select("id", { count: "exact", head: true }).eq("client_id", id).is("archived_at", null),
    ctx.supabase.from("documents").select("id", { count: "exact", head: true }).eq("entity_type", "client").eq("entity_id", id).is("archived_at", null),
    ctx.supabase.from("leads").select("id", { count: "exact", head: true }).eq("client_id", id).is("archived_at", null),
  ]);
  return { contacts: contacts.count ?? 0, sites: sites.count ?? 0, projects: projects.count ?? 0, documents: docs.count ?? 0, leads: leads.count ?? 0 };
}

export async function listContacts(ctx: OrgContext, clientId: string) {
  const { data } = await ctx.supabase.from("client_contacts").select("*").eq("client_id", clientId).is("archived_at", null).order("is_primary", { ascending: false }).order("first_name");
  return data ?? [];
}

export async function listSites(ctx: OrgContext, clientId: string) {
  const { data } = await ctx.supabase.from("sites").select("*").eq("client_id", clientId).is("archived_at", null).order("name");
  return data ?? [];
}

export async function listClientProjects(ctx: OrgContext, clientId: string) {
  const { data } = await ctx.supabase.from("projects").select("id, project_number, name, status, start_date, contract_value").eq("client_id", clientId).is("archived_at", null).order("created_at", { ascending: false });
  return data ?? [];
}

export async function listClientLeads(ctx: OrgContext, clientId: string) {
  const { data } = await ctx.supabase.from("leads").select("id, title, status, estimated_value, created_at").eq("client_id", clientId).is("archived_at", null).order("created_at", { ascending: false });
  return data ?? [];
}
