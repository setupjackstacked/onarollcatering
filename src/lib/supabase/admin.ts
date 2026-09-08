import "server-only";

import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Service-role client. BYPASSES RLS.
 * Only for trusted server code paths (public enquiry intake, system jobs).
 * Never import from a client component; never return this to the browser.
 */
export function createSupabaseAdminClient() {
  const { SUPABASE_SERVICE_ROLE_KEY } = serverEnv();
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase service-role environment variables are not configured.");
  }
  return createClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
