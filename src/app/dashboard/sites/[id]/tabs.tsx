"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "@/components/dashboard/entity";

export function SiteTabs({ base, counts }: { base: string; counts: { staff: number; documents: number; projects: number; pendingTimesheets: number } }) {
  const pathname = usePathname();
  const current = pathname === base || pathname === `${base}/edit` ? "overview" : (pathname.slice(base.length + 1).split("/")[0] ?? "overview");
  return (
    <Tabs base={base} current={current} tabs={[
      { key: "overview", label: "Overview" },
      { key: "staff", label: "Team", count: counts.staff },
      { key: "timesheets", label: "Timesheets", count: counts.pendingTimesheets || undefined },
      { key: "leave", label: "Leave" },
      { key: "documents", label: "Documents", count: counts.documents },
    ]} />
  );
}
