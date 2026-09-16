"use client";

import { useState } from "react";
import { Form, FormRow, TextField, TextArea, SelectField, DateField, CheckboxField, SubmitButton, FormActions, Hidden } from "../form";
import { recordVouchers, saveVoucherCategory } from "@/features/vouchers/actions";
import { ActionLink } from "../entity";

type Category = { id: string; label: string; description: string | null; is_chargeable: boolean };
type Opt = { value: string; label: string };

/**
 * The day's numbers. Quantities are posted as `qty:<categoryId>` so a new
 * category appears here the moment an administrator adds it.
 *
 * Built big and thumb-friendly: this is the screen a chef uses at the end of
 * a shift, one-handed, on a phone.
 */
export function VoucherEntryForm({
  siteId, siteName, date, categories, existing, sites, returnTo, allowDateChange = true,
}: {
  siteId: string; siteName?: string; date: string; categories: Category[];
  existing: Record<string, number>; sites?: Opt[]; returnTo?: string; allowDateChange?: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(categories.map((c) => [c.id, String(existing[c.id] ?? "")])),
  );
  const total = Object.values(values).reduce((n, v) => n + (Number(v) || 0), 0);

  const step = (id: string, by: number) =>
    setValues((v) => ({ ...v, [id]: String(Math.max(0, (Number(v[id]) || 0) + by)) }));

  return (
    <Form action={recordVouchers.bind(null, siteId)}>
      {returnTo ? <Hidden name="return" value={returnTo} /> : null}
      {allowDateChange ? (
        <FormRow>
          <DateField name="entry_date" label="Date" defaultValue={date} max={date} required />
          {sites ? <SelectField name="site_id_display" label="Site" options={sites} defaultValue={siteId} disabled hint="Change site from the site picker" /> : null}
        </FormRow>
      ) : (
        <>
          <Hidden name="entry_date" value={date} />
          {siteName ? <p className="text-sm text-muted-light">{siteName}</p> : null}
        </>
      )}

      <div className="space-y-3">
        {categories.map((c) => (
          <div key={c.id} className="rounded-lg border border-graphite/10 bg-white/50 p-3">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor={`f-qty:${c.id}`} className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{c.label}</span>
                {c.description ? <span className="block text-xs text-muted-light">{c.description}</span> : null}
                {!c.is_chargeable ? <span className="mt-1 inline-block rounded-full bg-graphite/8 px-2 py-0.5 text-[0.6875rem] text-muted-light">Not charged</span> : null}
              </label>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" aria-label={`Fewer ${c.label}`} onClick={() => step(c.id, -1)}
                  className="size-11 rounded-full border border-graphite/25 text-lg leading-none hover:border-graphite">−</button>
                <input
                  id={`f-qty:${c.id}`} name={`qty:${c.id}`} inputMode="numeric" pattern="[0-9]*"
                  value={values[c.id] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [c.id]: e.target.value.replace(/\D/g, "") }))}
                  placeholder="0"
                  className="num-lining h-11 w-20 rounded-md border border-graphite/20 bg-white/70 text-center text-lg focus:border-copper focus:bg-white focus:outline-none" />
                <button type="button" aria-label={`More ${c.label}`} onClick={() => step(c.id, 1)}
                  className="size-11 rounded-full border border-graphite/25 text-lg leading-none hover:border-graphite">+</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="rounded-md bg-copper/10 px-4 py-3 text-sm">Total today: <span className="num-lining font-medium">{total}</span></p>
      <TextArea name="notes" label="Notes" optional rows={2} placeholder="Anything unusual about today" />
      <SubmitButton variant="copper" className="h-12 w-full">Save today’s numbers</SubmitButton>
    </Form>
  );
}

export function VoucherCategoryForm({ category }: { category?: { id: string; key: string; label: string; description: string | null; is_chargeable: boolean; sort_order: number } | null }) {
  return (
    <Form action={saveVoucherCategory.bind(null, category?.id ?? null)}>
      <FormRow cols={3}>
        <TextField name="key" label="Key" defaultValue={category?.key} required readOnly={!!category} hint="Lowercase, e.g. contractor-meals" />
        <TextField name="label" label="Name" defaultValue={category?.label} required autoFocus />
        <TextField name="sort_order" label="Order" type="number" min={0} max={999} defaultValue={category?.sort_order ?? 50} />
      </FormRow>
      <TextField name="description" label="Description" optional defaultValue={category?.description ?? ""} hint="Shown under the name on the staff phone screen" />
      <CheckboxField name="is_chargeable" label="Charged to the client" value="true" defaultChecked={category?.is_chargeable ?? true}
        hint="Leave unticked for free and complimentary meals, so they can be reported separately" />
      <FormActions>
        <SubmitButton>{category ? "Save category" : "Add category"}</SubmitButton>
        <ActionLink href="/dashboard/settings/vouchers">Cancel</ActionLink>
      </FormActions>
    </Form>
  );
}
