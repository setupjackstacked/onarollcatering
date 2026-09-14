"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/auth/context";

/** Runs the alert sweep for this organisation on demand (the cron route does it nightly). */
export async function runAlerts() {
  const ctx = await requireOrgContext();
  if (!ctx.can("org.manage")) return { error: "Only owners and administrators can run this." };
  const [alerts] = await Promise.all([
    ctx.supabase.rpc("generate_alerts", { p_org: ctx.organisation.id }),
    ctx.supabase.rpc("expire_documents", { p_org: ctx.organisation.id }),
  ]);
  if (alerts.error) return { error: alerts.error.message };
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
}
