import "server-only";

import type { OrgContext } from "@/lib/auth/context";
import type { DocumentEntity } from "@/lib/supabase/types";

export async function listEntityDocuments(ctx: OrgContext, entityType: DocumentEntity, entityId: string) {
  const { data } = await ctx.supabase
    .from("documents")
    .select("id, name, category_key, mime_type, size_bytes, expiry_date, created_at, uploaded_by, version")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function documentCategories(ctx: OrgContext, entity: DocumentEntity) {
  const { data } = await ctx.supabase
    .from("document_categories")
    .select("key, label")
    .eq("organisation_id", ctx.organisation.id)
    .eq("entity", entity)
    .eq("active", true)
    .order("sort_order");
  return data?.length ? data : [{ key: "other", label: "Other" }];
}
