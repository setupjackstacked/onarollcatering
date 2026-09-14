import { requireOrgContext } from "@/lib/auth/context";
import { listActivity } from "@/features/shared/activity";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";

export default async function ClientActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const rows = await listActivity(ctx, "client", id, 100);
  return <div className="max-w-2xl"><ActivityTimeline rows={rows} /></div>;
}
