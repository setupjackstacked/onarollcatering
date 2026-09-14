import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listMembers, memberOptions } from "@/features/shared/members";
import { EntityHeader } from "@/components/dashboard/entity";
import { ClientForm } from "@/components/dashboard/forms/client-form";

export const metadata = { title: "New client" };

export default async function NewClientPage() {
  const ctx = await requireOrgContext("/dashboard/clients/new");
  if (!ctx.can("sales.write")) redirect("/dashboard/clients");
  const members = await listMembers(ctx);
  return (
    <div className="max-w-3xl">
      <EntityHeader back={{ href: "/dashboard/clients", label: "Clients" }} eyebrow="Sales" title="New client" />
      <ClientForm members={memberOptions(members)} />
    </div>
  );
}
