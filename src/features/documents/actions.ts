"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/auth/context";

export async function archiveDocument(id: string, revalidate: string) {
  const ctx = await requireOrgContext();
  await ctx.supabase.from("documents").update({ archived_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(revalidate);
}
