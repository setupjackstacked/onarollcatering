import { requireOrgContext } from "@/lib/auth/context";
import { listActivity } from "@/features/shared/activity";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";

export default async function ProjectActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const [a, b] = await Promise.all([listActivity(ctx, "projects", id, 100), listActivity(ctx, "project", id, 100)]);
  const rows = [...a, ...b].sort((x, y) => (x.created_at < y.created_at ? 1 : -1));
  return <div className="max-w-2xl"><ActivityTimeline rows={rows} /></div>;
}
