import "server-only";

import { cache } from "react";
import type { OrgContext } from "@/lib/auth/context";

export const listLeadSources = cache(async (ctx: OrgContext) => {
  const { data } = await ctx.supabase.from("lead_sources").select("key, label").eq("organisation_id", ctx.organisation.id).eq("active", true).order("sort_order");
  return data ?? [];
});

export const listServiceTypes = cache(async (ctx: OrgContext) => {
  const { data } = await ctx.supabase.from("service_types").select("key, label").eq("organisation_id", ctx.organisation.id).eq("active", true).order("sort_order");
  return data ?? [];
});

export const listClientOptions = cache(async (ctx: OrgContext) => {
  const { data } = await ctx.supabase.from("clients").select("id, name").eq("organisation_id", ctx.organisation.id).is("archived_at", null).order("name").limit(500);
  return (data ?? []).map((c) => ({ value: c.id, label: c.name }));
});

export const listSiteOptions = cache(async (ctx: OrgContext, clientId?: string | null) => {
  let q = ctx.supabase.from("sites").select("id, name, client_id, clients(name)").eq("organisation_id", ctx.organisation.id).is("archived_at", null).order("name").limit(500);
  if (clientId) q = q.eq("client_id", clientId);
  const { data } = await q;
  return (data ?? []).map((s) => ({ value: s.id, label: clientId ? s.name : `${s.name} — ${(s.clients as unknown as { name: string } | null)?.name ?? ""}` }));
});

export const listProjectOptions = cache(async (ctx: OrgContext) => {
  const { data } = await ctx.supabase.from("projects").select("id, name, project_number").eq("organisation_id", ctx.organisation.id).is("archived_at", null).order("created_at", { ascending: false }).limit(500);
  return (data ?? []).map((p) => ({ value: p.id, label: `${p.project_number} · ${p.name}` }));
});
