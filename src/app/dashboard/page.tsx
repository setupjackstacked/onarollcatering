import { requireOrgContext } from "@/lib/auth/context";
import { loadOverview } from "@/features/dashboard/overview";
import { OverviewView } from "@/components/dashboard/overview-view";

export const metadata = { title: "Overview" };

export default async function DashboardOverviewPage() {
  const ctx = await requireOrgContext();
  const data = await loadOverview(ctx);
  return <OverviewView data={data} orgName={ctx.organisation.name} canSales={ctx.can("sales.read")} />;
}
