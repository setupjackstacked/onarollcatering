import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listSupplierOptions } from "@/features/suppliers/queries";
import { listVatRates } from "@/features/quotes/queries";
import { EntityHeader } from "@/components/dashboard/entity";
import { EquipmentForm } from "@/components/dashboard/forms/supplier-forms";

export const metadata = { title: "Add equipment" };

export default async function NewEquipmentPage() {
  const ctx = await requireOrgContext("/dashboard/equipment/new");
  if (!ctx.can("finance.write")) redirect("/dashboard/equipment");
  const [suppliers, vat] = await Promise.all([listSupplierOptions(ctx), listVatRates(ctx)]);
  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: "/dashboard/equipment", label: "Equipment" }} eyebrow="Supply chain" title="Add equipment" />
      <EquipmentForm suppliers={suppliers} vatRates={vat.map((v) => ({ value: v.key, label: `${v.label} (${Number(v.rate)}%)` }))} />
    </div>
  );
}
