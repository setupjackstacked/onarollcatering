import { notFound, redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { getClient } from "@/features/clients/queries";
import { listMembers, memberOptions } from "@/features/shared/members";
import { ClientForm } from "@/components/dashboard/forms/client-form";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  if (!ctx.can("sales.write")) redirect(`/dashboard/clients/${id}`);
  const [client, members] = await Promise.all([getClient(ctx, id), listMembers(ctx)]);
  if (!client) notFound();
  return <div className="max-w-3xl"><ClientForm client={client} members={memberOptions(members)} /></div>;
}
