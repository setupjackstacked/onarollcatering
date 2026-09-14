import Link from "next/link";
import { requireOrgContext } from "@/lib/auth/context";

export const metadata = { title: "Staff portal" };

/** Shown when a signed-in account isn't linked to an employee record. */
export default async function NoRecordPage() {
  const ctx = await requireOrgContext("/staff");
  return (
    <div className="rounded-lg border border-graphite/10 bg-white/50 p-6">
      <h1 className="font-display text-2xl">Your account isn’t linked to an employee record yet</h1>
      <p className="mt-3 text-sm text-muted-light">
        Ask your manager to open Employees in the dashboard, find your record and link it to {ctx.user.email}. Once that’s done your shifts, timesheets and documents appear here.
      </p>
      {ctx.can("workforce.write") ? (
        <p className="mt-5 text-sm"><Link href="/dashboard/employees" className="underline">Open Employees</Link></p>
      ) : null}
    </div>
  );
}
