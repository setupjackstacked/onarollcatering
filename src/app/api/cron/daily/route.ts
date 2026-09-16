import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Nightly housekeeping: expire quotes, refresh overdue invoices, mark lapsed
 * compliance documents and raise dashboard notifications.
 *
 * Protected by CRON_SECRET (Vercel Cron sends it as a Bearer token). Without
 * the secret set the route refuses to run rather than being publicly callable.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!isSupabaseConfigured) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const admin = createSupabaseAdminClient();
  const { data: orgs, error: orgError } = await admin.from("organisations").select("id");
  if (orgError) {
    logger.error("cron.daily_failed", { message: orgError.message });
    return NextResponse.json({ error: "Couldn’t load organisations." }, { status: 500 });
  }

  let alerts = 0;
  const failures: string[] = [];
  for (const org of orgs ?? []) {
    const [a, d, o] = await Promise.all([
      admin.rpc("generate_alerts", { p_org: org.id }),
      admin.rpc("expire_documents", { p_org: org.id }),
      admin.rpc("generate_operations_alerts", { p_org: org.id }),
    ]);
    if (a.error) failures.push(`${org.id}: ${a.error.message}`);
    else alerts += Number(a.data ?? 0);
    if (d.error) failures.push(`${org.id}: ${d.error.message}`);
    if (o.error) failures.push(`${org.id}: ${o.error.message}`);
    else alerts += Number(o.data ?? 0);
  }
  if (failures.length) logger.error("cron.daily_partial", { failures });
  logger.info("cron.daily", { organisations: (orgs ?? []).length, alerts });
  return NextResponse.json({ ok: failures.length === 0, organisations: (orgs ?? []).length, alerts, failures });
}
