import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/auth/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Download via short-lived signed URL. RLS decides whether the user may see the row. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const { data: doc } = await ctx.supabase.from("documents").select("bucket, storage_path, name").eq("id", id).is("archived_at", null).maybeSingle();
  if (!doc) return new NextResponse("Not found", { status: 404 });
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage.from(doc.bucket).createSignedUrl(doc.storage_path, 120, { download: doc.name });
  if (error || !data) return new NextResponse("Unavailable", { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
