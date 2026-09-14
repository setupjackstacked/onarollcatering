import { requireOrgContext } from "@/lib/auth/context";
import { listInvoices } from "@/features/invoices/queries";
import { InvoicesTable } from "@/components/dashboard/tables/invoices-table";
import { ActionLink } from "@/components/dashboard/entity";

export default async function InvoicesTab({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const { rows } = await listInvoices(ctx, await searchParams, { clientId: id });
  return (
    <div className="space-y-4">
      {ctx.can("finance.write") ? <div><ActionLink href={`/dashboard/invoices/new?client=${id}`} variant="copper">New invoice</ActionLink></div> : null}
      <InvoicesTable rows={rows} showClient={false} empty={{ title: "No invoices yet" }} />
    </div>
  );
}
