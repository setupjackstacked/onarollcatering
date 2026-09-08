import type { Metadata } from "next";
import { Logo } from "@/components/marketing/logo";
import { LinkButton } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Dashboard sign in", robots: { index: false, follow: false } };

/**
 * Phase 0 stub. The real sign-in form (email/password, reset) is built in
 * Phase 3 on top of Supabase Auth. Nothing here pretends to work.
 */
export default function LoginPage() {
  return (
    <main className="surface-dark grain relative flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <Logo className="mx-auto h-24" />
        <h1 className="font-display mt-10 text-3xl">Dashboard</h1>
        <p className="mt-3 text-sm text-ivory/60">
          Sign-in is delivered in Phase 3.
          {isSupabaseConfigured ? "" : " Supabase is not yet configured for this environment."}
        </p>
        <LinkButton href="/" variant="outlineLight" size="sm" className="mt-8">
          Back to website
        </LinkButton>
      </div>
    </main>
  );
}
