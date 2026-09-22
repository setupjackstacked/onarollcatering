import "server-only";

import type { GenerateLinkType } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export type MintedLink = { url: string; userId: string };

/**
 * Mints a one-time sign-in link for an email we are about to send ourselves.
 *
 * We deliberately do NOT use the `action_link` Supabase hands back. That link
 * points at Supabase's own verify endpoint and, under the PKCE flow this app
 * uses, expects a verifier cookie in the browser that opens it — which is not
 * there, because an admin generated the link from a different machine. It
 * fails with an unhelpful error that looks like an expired link.
 *
 * The hashed token is the part that matters. We wrap it in a URL on our own
 * domain, which /dashboard/auth/confirm verifies. That also means every link in
 * every email points at onarollcatering.com rather than a supabase.co address,
 * which is what a recipient should see.
 */
export async function mintAuthLink(
  type: Extract<GenerateLinkType, "invite" | "recovery" | "magiclink">,
  email: string,
  next = "/dashboard/reset-password",
): Promise<MintedLink | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type, email });

  if (error || !data?.properties?.hashed_token || !data.user) {
    logger.warn("auth.link_mint_failed", { type, reason: error?.message });
    return null;
  }

  const url = new URL("/dashboard/auth/confirm", publicEnv.NEXT_PUBLIC_SITE_URL);
  url.searchParams.set("token_hash", data.properties.hashed_token);
  url.searchParams.set("type", type === "magiclink" ? "magiclink" : type);
  url.searchParams.set("next", next);
  return { url: url.toString(), userId: data.user.id };
}
