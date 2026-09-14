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

const QUOTE_TONES: Record<string, { label: string; tone: import("@/lib/domain/statuses").StatusTone }> = {
  draft: { label: "Draft", tone: "grey" }, sent: { label: "Sent", tone: "blue" }, viewed: { label: "Viewed", tone: "blue" }, accepted: { label: "Accepted", tone: "green" },
  rejected: { label: "Rejected", tone: "red" }, expired: { label: "Expired", tone: "amber" }, superseded: { label: "Superseded", tone: "grey" },
};
export function QuoteBadge({ status }: { status: string }) {
  const s = QUOTE_TONES[status];
  return <StatusBadge label={s?.label ?? status} tone={s?.tone ?? "grey"} />;
}

const INVOICE_TONES: Record<string, { label: string; tone: import("@/lib/domain/statuses").StatusTone }> = {
  draft: { label: "Draft", tone: "grey" }, issued: { label: "Issued", tone: "blue" }, part_paid: { label: "Part paid", tone: "amber" }, paid: { label: "Paid", tone: "green" },
  overdue: { label: "Overdue", tone: "red" }, cancelled: { label: "Cancelled", tone: "grey" }, credit: { label: "Credit note", tone: "copper" },
};
export function InvoiceBadge({ status }: { status: string }) {
  const s = INVOICE_TONES[status];
  return <StatusBadge label={s?.label ?? status} tone={s?.tone ?? "grey"} />;
}

const EXPENSE_TONES: Record<string, { label: string; tone: import("@/lib/domain/statuses").StatusTone }> = {
  pending: { label: "Pending", tone: "amber" }, committed: { label: "Committed", tone: "blue" }, actual: { label: "Actual", tone: "green" }, paid: { label: "Paid", tone: "green" }, rejected: { label: "Rejected", tone: "grey" },
};
export function ExpenseBadge({ status }: { status: string }) {
  const s = EXPENSE_TONES[status];
  return <StatusBadge label={s?.label ?? status} tone={s?.tone ?? "grey"} />;
}
