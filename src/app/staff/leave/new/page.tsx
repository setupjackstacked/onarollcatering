import Link from "next/link";
import { requireStaff } from "@/features/staff/queries";
import { RequestLeaveForm } from "@/components/staff/forms";

export const metadata = { title: "Request leave" };

export default async function RequestLeavePage() {
  await requireStaff("/staff/leave/new");
  return (
    <div className="space-y-5">
      <div>
        <Link href="/staff/leave" className="text-sm underline">← Leave</Link>
        <h1 className="font-display display-sm mt-2">Request leave</h1>
        <p className="mt-1 text-sm text-muted-light">Your manager is notified and decides. Approved leave blocks you out on the rota.</p>
      </div>
      <RequestLeaveForm />
    </div>
  );
}
