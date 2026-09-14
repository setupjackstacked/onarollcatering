"use client";

import { Form, FormRow, TextField, TextArea, SelectField, MoneyField, CheckboxField, SubmitButton, FormActions } from "../form";
import { saveCatalogueItem, saveVatRate } from "@/features/quotes/catalogue-actions";
import { ActionLink } from "../entity";

export const CATEGORIES = [
  { value: "equipment", label: "Equipment" }, { value: "labour", label: "Labour" }, { value: "installation", label: "Installation" }, { value: "catering", label: "Catering" }, { value: "transport", label: "Transport" }, { value: "materials", label: "Materials" }, { value: "professional_services", label: "Professional services" }, { value: "other", label: "Other" },
];

type Item = { id: string; name: string; category: string; description: string | null; unit: string; cost_price: string; sell_price: string; vat_rate_key: string };
type Vat = { id: string; key: string; label: string; rate: string; is_default: boolean };

export function CatalogueItemForm({ item, vatRates }: { item?: Item | null; vatRates: { value: string; label: string }[] }) {
  return (
    <Form action={saveCatalogueItem.bind(null, item?.id ?? null)}>
      <FormRow>
        <TextField name="name" label="Name" defaultValue={item?.name} required autoFocus />
        <SelectField name="category" label="Category" options={CATEGORIES} defaultValue={item?.category ?? "other"} />
      </FormRow>
      <TextArea name="description" label="Description" optional defaultValue={item?.description ?? ""} rows={2} hint="Used as the default line description on quotes" />
      <FormRow cols={3}>
        <TextField name="unit" label="Unit" defaultValue={item?.unit ?? "each"} hint="each, day, hour, week, m²…" />
        <MoneyField name="cost_price" label="Cost price" defaultValue={item?.cost_price ?? ""} hint="Internal only — never shown to customers" />
        <MoneyField name="sell_price" label="Sell price" defaultValue={item?.sell_price ?? ""} />
      </FormRow>
      <SelectField name="vat_rate_key" label="VAT rate" options={vatRates} defaultValue={item?.vat_rate_key ?? "standard"} className="sm:max-w-xs" />
      <FormActions>
        <SubmitButton>{item ? "Save item" : "Add item"}</SubmitButton>
        <ActionLink href="/dashboard/settings/catalogue">Cancel</ActionLink>
      </FormActions>
    </Form>
  );
}

export function VatRateForm({ rate }: { rate?: Vat | null }) {
  return (
    <Form action={saveVatRate.bind(null, rate?.id ?? null)}>
      <FormRow cols={3}>
        <TextField name="key" label="Key" defaultValue={rate?.key} required readOnly={!!rate} hint="e.g. standard, reduced, zero" />
        <TextField name="label" label="Label" defaultValue={rate?.label} required />
        <TextField name="rate" label="Rate %" type="number" min={0} max={100} step="0.01" defaultValue={rate?.rate ?? "20"} required />
      </FormRow>
      <CheckboxField name="is_default" label="Default rate for new lines" value="true" defaultChecked={rate?.is_default} />
      <FormActions>
        <SubmitButton>{rate ? "Save rate" : "Add rate"}</SubmitButton>
        <ActionLink href="/dashboard/settings/catalogue">Cancel</ActionLink>
      </FormActions>
    </Form>
  );
}
