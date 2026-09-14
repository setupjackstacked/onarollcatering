import { requireOrgContext } from "@/lib/auth/context";
import { listQuotes } from "@/features/quotes/queries";
import { QuotesTable } from "@/components/dashboard/tables/quotes-table";
import { ActionLink } from "@/components/dashboard/entity";

export default async function QuotesTab({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const { rows } = await listQuotes(ctx, await searchParams, { clientId: id });
  return (
    <div className="space-y-4">
      {ctx.can("sales.write") ? <div><ActionLink href={`/dashboard/quotes/new?client=${id}`} variant="copper">New quote</ActionLink></div> : null}
      <QuotesTable rows={rows} showClient={false} empty={{ title: "No quotes yet" }} />
    </div>
  );
}
