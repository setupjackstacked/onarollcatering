import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getExpense } from "@/features/expenses/queries";
import { listProjectOptions } from "@/features/shared/lookups";
import { listSupplierOptions } from "@/features/suppliers/queries";
import { EntityHeader } from "@/components/dashboard/entity";
import { ExpenseForm } from "@/components/dashboard/forms/expense-forms";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/expenses/${id}/edit`);
  const e = await getExpense(ctx, id);
  if (!e) notFound();
  if (!ctx.can("finance.write") && !(ctx.role === "project_manager" && e.status === "pending")) redirect(`/dashboard/expenses/${id}`);
  const [projects, suppliers] = await Promise.all([listProjectOptions(ctx), listSupplierOptions(ctx)]);
  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: `/dashboard/expenses/${id}`, label: "Cost" }} eyebrow="Editing" title={e.description} />
      <ExpenseForm expense={e} projects={projects} suppliers={suppliers} canApprove={ctx.can("finance.write")} />
    </div>
  );
}
