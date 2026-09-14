import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireOrgContext } from "@/lib/auth/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DOC_BUCKETS, DOC_MAX_BYTES, DOC_ALLOWED } from "@/features/documents/shared";
import { logger } from "@/lib/logger";
import type { DocumentEntity } from "@/lib/supabase/types";

export const runtime = "nodejs";

const meta = z.object({
  entityType: z.enum(["client", "project", "employee", "quote", "invoice", "supplier", "lead", "site"]),
  entityId: z.string().uuid(),
  category: z.string().min(1).max(60).default("other"),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
});

/**
 * Authenticated document upload. Permission is enforced by inserting the
 * metadata row through the user's RLS-scoped client FIRST; only if that
 * succeeds do we write the file with the service role. Failure → row removed.
 */
export async function POST(request: Request) {
  const ctx = await requireOrgContext();
  const form = await request.formData();
  const file = form.get("file");
  const parsed = meta.safeParse({
    entityType: form.get("entityType"),
    entityId: form.get("entityId"),
    category: form.get("category") || "other",
    expiryDate: form.get("expiryDate") || "",
  });
  if (!(file instanceof File) || !parsed.success) return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  if (file.size === 0 || file.size > DOC_MAX_BYTES) return NextResponse.json({ error: `Files must be under ${DOC_MAX_BYTES / 1024 / 1024} MB.` }, { status: 400 });

  const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  const allowedForType = DOC_ALLOWED[file.type];
  const allowedExt = Object.values(DOC_ALLOWED).flat().includes(ext);
  if (!allowedExt || (allowedForType && !allowedForType.includes(ext))) {
    return NextResponse.json({ error: "File type not accepted." }, { status: 400 });
  }

  const entityType = parsed.data.entityType as DocumentEntity;
  const bucket = DOC_BUCKETS[entityType];
  const safeName = file.name.replace(/[^\w.\- ()]+/g, "_").slice(0, 140);
  const path = `${ctx.organisation.id}/${entityType}/${parsed.data.entityId}/${randomUUID()}-${safeName}`;

  const { data: row, error } = await ctx.supabase
    .from("documents")
    .insert({
      organisation_id: ctx.organisation.id,
      entity_type: entityType,
      entity_id: parsed.data.entityId,
      category_key: parsed.data.category,
      name: file.name,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      bucket,
      storage_path: path,
      expiry_date: parsed.data.expiryDate || null,
      uploaded_by: ctx.user.id,
    })
    .select("id")
    .single();
  if (error || !row) {
    return NextResponse.json({ error: error?.code === "42501" ? "You don’t have permission to add documents here." : "Couldn’t save the document." }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const up = await admin.storage.from(bucket).upload(path, new Uint8Array(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (up.error) {
    await admin.from("documents").delete().eq("id", row.id);
    logger.error("documents.upload_failed", { error: up.error.message });
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ id: row.id, name: file.name });
}
