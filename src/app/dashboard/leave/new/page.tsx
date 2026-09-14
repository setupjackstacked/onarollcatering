import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listEmployeeOptions } from "@/features/workforce/queries";
import { EntityHeader } from "@/components/dashboard/entity";
import { LeaveForm } from "@/components/dashboard/forms/workforce-forms";
import { str } from "@/lib/pagination";

export const metadata = { title: "Record leave" };

export default async function NewLeavePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/leave/new");
  if (!ctx.can("workforce.write")) redirect("/dashboard/leave");
  const sp = await searchParams;
  const employees = await listEmployeeOptions(ctx);
  const ret = str(sp.return) || "/dashboard/leave";
  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: ret, label: "Leave" }} eyebrow="Workforce" title="Record leave" />
      <LeaveForm employees={employees} returnTo={ret} defaults={{ employee_id: str(sp.employee) || undefined }} />
    </div>
  );
}
