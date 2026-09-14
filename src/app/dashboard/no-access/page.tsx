import { getCurrentUser } from "@/lib/auth/session";
import { signOut } from "@/features/auth/actions";
import { Logo } from "@/components/marketing/logo";

export const metadata = { title: "No access", robots: { index: false } };

/** Signed in, but not a member of any organisation. Outside the shell (layout.tsx redirects here). */
export default async function NoAccessPage() {
  const user = await getCurrentUser();
  return (
    <main className="surface-dark grain flex min-h-dvh items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        <Logo variant="horizontal" className="mx-auto h-10" />
        <h1 className="font-display mt-10 text-3xl">No organisation access</h1>
        <p className="mt-3 text-sm text-ivory/60">
          {user?.email} is signed in but hasn’t been added to an organisation. Ask an owner or administrator to invite you.
        </p>
        <form action={signOut} className="mt-8">
          <button type="submit" className="h-11 rounded-full border border-ivory/30 px-6 text-sm hover:bg-ivory/10">Sign out</button>
        </form>
      </div>
    </main>
  );
}
