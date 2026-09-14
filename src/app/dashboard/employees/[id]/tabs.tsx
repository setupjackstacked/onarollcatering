"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "@/components/dashboard/entity";

export function EmployeeTabs({ base, counts }: { base: string; counts: { documents: number; shifts: number; timesheets: number; leave: number } }) {
  const pathname = usePathname();
  const current = pathname === base || pathname === `${base}/edit` ? "overview" : (pathname.slice(base.length + 1).split("/")[0] ?? "overview");
  return (
    <Tabs base={base} current={current} tabs={[
      { key: "overview", label: "Overview" },
      { key: "documents", label: "Compliance", count: counts.documents },
      { key: "shifts", label: "Upcoming shifts", count: counts.shifts },
      { key: "timesheets", label: "Timesheets", count: counts.timesheets },
      { key: "leave", label: "Leave", count: counts.leave },
    ]} />
  );
}
