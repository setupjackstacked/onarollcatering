import { StatusBadge } from "@/components/dashboard/primitives";
import { LEAD_STATUSES, PROJECT_STATUSES, ENQUIRY_STATUSES } from "@/lib/domain/statuses";

export function LeadBadge({ status }: { status: string }) {
  const s = LEAD_STATUSES.find((x) => x.value === status);
  return <StatusBadge label={s?.label ?? status} tone={s?.tone ?? "grey"} />;
}
export function ProjectBadge({ status }: { status: string }) {
  const s = PROJECT_STATUSES.find((x) => x.value === status);
  return <StatusBadge label={s?.label ?? status} tone={s?.tone ?? "grey"} />;
}
export function EnquiryBadge({ status }: { status: string }) {
  const s = ENQUIRY_STATUSES.find((x) => x.value === status);
  return <StatusBadge label={s?.label ?? status} tone={s?.tone ?? "grey"} />;
}
