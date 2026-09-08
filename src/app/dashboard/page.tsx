import { getCurrentUser, getMemberships } from "@/lib/auth/session";

export const metadata = { title: "Overview", robots: { index: false } };

/** Phase 3 replaces this with the real overview. */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  const memberships = await getMemberships();
  return (
    <main className="container-x py-16">
      <p className="eyebrow text-copper-dark">Dashboard</p>
      <h1 className="font-display display-md mt-3">Coming in Phase 3</h1>
      <p className="mt-4 text-muted-light">
        Signed in as {user?.email}. {memberships.length ? `Organisation: ${memberships[0]!.organisationName} (${memberships[0]!.role}).` : "No organisation membership yet."}
      </p>
    </main>
  );
}
