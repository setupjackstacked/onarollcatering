import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getSupplier } from "@/features/suppliers/queries";
import { EntityHeader } from "@/components/dashboard/entity";
import { SupplierForm } from "@/components/dashboard/forms/supplier-forms";

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext(`/dashboard/suppliers/${id}/edit`);
  if (!ctx.can("finance.write")) redirect(`/dashboard/suppliers/${id}`);
  const supplier = await getSupplier(ctx, id);
  if (!supplier) notFound();
  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: `/dashboard/suppliers/${id}`, label: supplier.name }} eyebrow="Editing" title={supplier.name} />
      <SupplierForm supplier={supplier} />
    </div>
  );
}
