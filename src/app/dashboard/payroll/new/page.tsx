import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { EntityHeader } from "@/components/dashboard/entity";
import { PayPeriodForm } from "@/components/dashboard/forms/payroll-forms";

export const metadata = { title: "New pay period" };

export default async function NewPayPeriodPage() {
  const ctx = await requireOrgContext("/dashboard/payroll/new");
  if (!ctx.can("finance.write")) redirect("/dashboard/payroll");
  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: "/dashboard/payroll", label: "Payroll" }} eyebrow="Finance" title="New pay period" />
      <PayPeriodForm />
    </div>
  );
}
