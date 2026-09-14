import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listProjectOptions } from "@/features/shared/lookups";
import { listSupplierOptions } from "@/features/suppliers/queries";
import { EntityHeader } from "@/components/dashboard/entity";
import { ExpenseForm } from "@/components/dashboard/forms/expense-forms";
import { str } from "@/lib/pagination";
import { isoDateOffset } from "@/lib/dates";

export const metadata = { title: "Record cost" };

export default async function NewExpensePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/expenses/new");
  if (!ctx.can("finance.write") && ctx.role !== "project_manager") redirect("/dashboard/expenses");
  const sp = await searchParams;
  const [projects, suppliers] = await Promise.all([listProjectOptions(ctx), listSupplierOptions(ctx)]);
  const ret = str(sp.return);
  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: ret || "/dashboard/expenses", label: ret ? "Back" : "Expenses" }} eyebrow="Finance" title="Record a cost" />
      <ExpenseForm projects={projects} suppliers={suppliers} canApprove={ctx.can("finance.write")} defaults={{ project_id: str(sp.project) || undefined, supplier_id: str(sp.supplier) || undefined, expense_date: isoDateOffset(0) }} returnTo={ret || undefined} />
    </div>
  );
}
