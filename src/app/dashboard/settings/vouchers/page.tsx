import { redirect } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/context";
import { listVoucherCategories } from "@/features/vouchers/queries";
import { setVoucherCategoryActive } from "@/features/vouchers/actions";
import { PageHeader, Panel, StatusBadge } from "@/components/dashboard/primitives";
import { ActionLink } from "@/components/dashboard/entity";
import { ConfirmAction } from "@/components/dashboard/confirm";
import { VoucherCategoryForm } from "@/components/dashboard/forms/voucher-forms";
import { str } from "@/lib/pagination";

export const metadata = { title: "Voucher categories" };

export default async function VoucherCategoriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext("/dashboard/settings/vouchers");
  if (!ctx.can("org.manage")) redirect("/dashboard/settings");
  const sp = await searchParams;
  const categories = await listVoucherCategories(ctx, true);
  const editing = str(sp.edit) ? categories.find((c) => c.id === str(sp.edit)) : null;
  const adding = str(sp.add) === "1";

  return (
    <>
      <PageHeader eyebrow="Settings" title="Voucher categories"
        description="What each kitchen counts at the end of the day. Changes appear on the staff phone screen immediately."
        actions={<><ActionLink href="?add=1" variant="copper">Add category</ActionLink><ActionLink href="/dashboard/settings">Settings</ActionLink></>} />

      {adding || editing ? (
        <Panel title={editing ? `Edit ${editing.label}` : "New category"} className="mb-6">
          <div className="max-w-3xl"><VoucherCategoryForm category={editing} /></div>
        </Panel>
      ) : null}

      <Panel title={`Categories (${categories.filter((c) => c.active).length} active)`}>
        <ul className="divide-y divide-graphite/10">
          {categories.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{c.label}</span>
                <span className="block text-xs text-muted-light">{c.description ?? "No description"} · key: {c.key}</span>
              </span>
              <StatusBadge label={c.is_chargeable ? "Charged" : "Free / complimentary"} tone={c.is_chargeable ? "blue" : "grey"} />
              {!c.active ? <StatusBadge label="Hidden" tone="grey" /> : null}
              <span className="flex gap-1">
                <ActionLink href={`?edit=${c.id}`} className="h-8 px-3 text-xs">Edit</ActionLink>
                {c.active ? (
                  <ConfirmAction action={setVoucherCategoryActive.bind(null, c.id, false)} label="Hide" title={`Hide ${c.label}?`} description="It disappears from the staff screen. Numbers already logged against it are kept and still report." confirmLabel="Hide" className="h-8 px-3 text-xs" />
                ) : (
                  <ConfirmAction action={setVoucherCategoryActive.bind(null, c.id, true)} label="Show" title={`Show ${c.label} again?`} variant="outline" confirmLabel="Show" className="h-8 px-3 text-xs" />
                )}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
