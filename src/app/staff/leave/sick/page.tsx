import Link from "next/link";
import { requireStaff } from "@/features/staff/queries";
import { ReportSickForm } from "@/components/staff/sick-form";

export const metadata = { title: "Report sick" };

export default async function ReportSickPage() {
  await requireStaff("/staff/leave/sick");
  return (
    <div className="space-y-5">
      <div>
        <Link href="/staff/leave" className="text-sm underline">← Leave</Link>
        <h1 className="font-display display-sm mt-2">Report sickness</h1>
        <p className="mt-1 text-sm text-muted-light">Your manager is told straight away so cover can be arranged.</p>
      </div>
      <ReportSickForm />
    </div>
  );
}
