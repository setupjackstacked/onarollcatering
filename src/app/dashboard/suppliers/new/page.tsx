import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { EntityHeader } from "@/components/dashboard/entity";
import { SupplierForm } from "@/components/dashboard/forms/supplier-forms";

export const metadata = { title: "Add supplier" };

export default async function NewSupplierPage() {
  const ctx = await requireOrgContext("/dashboard/suppliers/new");
  if (!ctx.can("finance.write")) redirect("/dashboard/suppliers");
  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: "/dashboard/suppliers", label: "Suppliers" }} eyebrow="Supply chain" title="Add supplier" />
      <SupplierForm />
    </div>
  );
}
