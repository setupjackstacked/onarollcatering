import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listAllPayments } from "@/features/invoices/queries";
import { PageHeader } from "@/components/dashboard/primitives";
import { DataTable } from "@/components/dashboard/data-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { formatGBP, toPence } from "@/lib/money";
import { formatDateUK } from "@/lib/dates";
import { pageHref } from "@/lib/query-string";
import { PAYMENT_METHODS } from "@/features/invoices/schema";

export const metadata = { title: "Payments" };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/payments");
  if (!ctx.can("finance.read")) redirect("/dashboard");
  const sp = await searchParams;
  const { rows, total, page, size } = await listAllPayments(ctx, sp);
  return (
    <>
      <PageHeader eyebrow="Finance" title="Payments" description="Every payment recorded against an invoice. Record payments from the invoice page." />
      <FilterBar filters={[{ name: "method", label: "All methods", options: PAYMENT_METHODS }]} searchPlaceholder="Reference" />
      <DataTable rows={rows} rowKey={(r) => r.id} rowHref={(r) => `/dashboard/invoices/${r.invoice_id}`}
        columns={[
          { key: "d", header: "Received", render: (r) => formatDateUK(r.paid_on) },
          { key: "i", header: "Invoice", render: (r) => { const inv = r.invoices as unknown as { invoice_number: string; title: string } | null; return <span><span className="num-lining">{inv?.invoice_number}</span> <span className="text-muted-light">· {inv?.title}</span></span>; } },
          { key: "c", header: "Client", render: (r) => ((r.invoices as unknown as { clients: { name: string } | null } | null)?.clients?.name ?? "—") },
          { key: "m", header: "Method", render: (r) => PAYMENT_METHODS.find((m) => m.value === r.method)?.label ?? r.method },
          { key: "r", header: "Reference", render: (r) => r.reference ?? "—" },
          { key: "a", header: "Amount", align: "right", render: (r) => formatGBP(toPence(r.amount)) },
        ]}
        empty={{ title: "No payments recorded yet" }}
        pagination={{ page, size, total, hrefFor: pageHref("/dashboard/payments", sp) }} />
    </>
  );
}
