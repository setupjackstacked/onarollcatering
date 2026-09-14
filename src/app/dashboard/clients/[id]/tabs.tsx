"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "@/components/dashboard/entity";

export function ClientTabs({ base, counts }: { base: string; counts: { contacts: number; sites: number; projects: number; documents: number; leads: number } }) {
  const pathname = usePathname();
  const current = pathname === base || pathname === `${base}/edit` ? "overview" : (pathname.slice(base.length + 1).split("/")[0] ?? "overview");
  return (
    <Tabs
      base={base}
      current={current}
      tabs={[
        { key: "overview", label: "Overview" },
        { key: "contacts", label: "Contacts", count: counts.contacts },
        { key: "sites", label: "Sites", count: counts.sites },
        { key: "leads", label: "Leads", count: counts.leads },
        { key: "projects", label: "Projects", count: counts.projects },
        { key: "quotes", label: "Quotes" },
        { key: "invoices", label: "Invoices" },
        { key: "documents", label: "Documents", count: counts.documents },
        { key: "activity", label: "Activity" },
      ]}
    />
  );
}
