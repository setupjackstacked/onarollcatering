"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "@/components/dashboard/entity";

export function ProjectTabs({ base, counts }: { base: string; counts: { tasks: number; documents: number } }) {
  const pathname = usePathname();
  const current = pathname === base || pathname === `${base}/edit` ? "overview" : (pathname.slice(base.length + 1).split("/")[0] ?? "overview");
  return (
    <Tabs base={base} current={current} tabs={[
      { key: "overview", label: "Overview" },
      { key: "tasks", label: "Tasks", count: counts.tasks },
      { key: "staff", label: "Staff", disabled: "P8" },
      { key: "timesheets", label: "Timesheets", disabled: "P8" },
      { key: "costs", label: "Costs" },
      { key: "quotes", label: "Quotes" },
      { key: "invoices", label: "Invoices" },
      { key: "documents", label: "Documents", count: counts.documents },
      { key: "activity", label: "Activity" },
    ]} />
  );
}
