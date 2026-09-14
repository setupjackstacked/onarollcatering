"use client";

import { Form, FormRow, FormSection, TextField, TextArea, SelectField, MoneyField, CheckboxField, SubmitButton, FormActions } from "../form";
import { saveSupplier, saveSupplierContact, saveEquipment } from "@/features/suppliers/actions";
import { SUPPLIER_CATEGORIES, EQUIPMENT_CATEGORIES } from "@/features/suppliers/schema";
import type { Tables } from "@/lib/supabase/types";
import { ActionLink } from "../entity";

type Opt = { value: string; label: string };
type Address = { line1?: string | null; city?: string | null; postcode?: string | null };

export function SupplierForm({ supplier }: { supplier?: Tables<"suppliers"> | null }) {
  const addr = (supplier?.address ?? {}) as Address;
  return (
    <Form action={saveSupplier.bind(null, supplier?.id ?? null)}>
      <FormSection title="Company">
        <FormRow>
          <TextField name="name" label="Company name" defaultValue={supplier?.name} required autoFocus />
          <SelectField name="category" label="Category" options={SUPPLIER_CATEGORIES as unknown as Opt[]} defaultValue={supplier?.category ?? "other"} />
        </FormRow>
        <FormRow cols={3}>
          <TextField name="email" label="Email" type="email" optional defaultValue={supplier?.email ?? ""} />
          <TextField name="phone" label="Phone" type="tel" optional defaultValue={supplier?.phone ?? ""} />
          <TextField name="website" label="Website" optional defaultValue={supplier?.website ?? ""} placeholder="https://" />
        </FormRow>
        <FormRow cols={3}>
          <TextField name="address_line1" label="Address" optional defaultValue={addr.line1 ?? ""} />
          <TextField name="address_city" label="Town / city" optional defaultValue={addr.city ?? ""} />
          <TextField name="address_postcode" label="Postcode" optional defaultValue={addr.postcode ?? ""} />
        </FormRow>
      </FormSection>
      <FormSection title="Account">
        <FormRow cols={3}>
          <TextField name="vat_number" label="VAT number" optional defaultValue={supplier?.vat_number ?? ""} />
          <TextField name="account_number" label="Our account number" optional defaultValue={supplier?.account_number ?? ""} />
          <TextField name="payment_terms_days" label="Payment terms (days)" type="number" min={0} max={180} defaultValue={supplier?.payment_terms_days ?? 30} />
        </FormRow>
        <TextArea name="notes" label="Notes" optional defaultValue={supplier?.notes ?? ""} rows={3} />
      </FormSection>
      <FormActions>
        <SubmitButton>{supplier ? "Save supplier" : "Add supplier"}</SubmitButton>
        <ActionLink href={supplier ? `/dashboard/suppliers/${supplier.id}` : "/dashboard/suppliers"}>Cancel</ActionLink>
      </FormActions>
    </Form>
  );
}

export function SupplierContactForm({ supplierId, contact }: { supplierId: string; contact?: Tables<"supplier_contacts"> | null }) {
  return (
    <Form action={saveSupplierContact.bind(null, supplierId, contact?.id ?? null)}>
      <FormRow cols={3}>
        <TextField name="first_name" label="First name" defaultValue={contact?.first_name} required />
        <TextField name="last_name" label="Last name" optional defaultValue={contact?.last_name ?? ""} />
        <TextField name="job_title" label="Job title" optional defaultValue={contact?.job_title ?? ""} />
      </FormRow>
      <FormRow cols={3}>
        <TextField name="email" label="Email" type="email" optional defaultValue={contact?.email ?? ""} />
        <TextField name="phone" label="Phone" type="tel" optional defaultValue={contact?.phone ?? ""} />
        <CheckboxField name="is_primary" label="Main contact" value="true" defaultChecked={contact?.is_primary} />
      </FormRow>
      <SubmitButton>{contact ? "Save contact" : "Add contact"}</SubmitButton>
    </Form>
  );
}

export function EquipmentForm({ equipment, suppliers, vatRates }: { equipment?: Tables<"equipment"> | null; suppliers: Opt[]; vatRates: Opt[] }) {
  return (
    <Form action={saveEquipment.bind(null, equipment?.id ?? null)}>
      <FormSection title="Item">
        <FormRow>
          <TextField name="name" label="Name" defaultValue={equipment?.name} required autoFocus placeholder="e.g. 6-burner gas range, 900mm" />
          <SelectField name="category" label="Category" options={EQUIPMENT_CATEGORIES} defaultValue={equipment?.category ?? "equipment"} />
        </FormRow>
        <FormRow>
          <SelectField name="supplier_id" label="Supplier" optional options={suppliers} placeholder="Not specified" defaultValue={equipment?.supplier_id ?? ""} />
          <TextField name="supplier_sku" label="Supplier SKU" optional defaultValue={equipment?.supplier_sku ?? ""} />
        </FormRow>
        <TextArea name="description" label="Description" optional defaultValue={equipment?.description ?? ""} rows={2} hint="Used as the quotation line description" />
        <TextArea name="specification" label="Specification" optional defaultValue={equipment?.specification ?? ""} rows={4} hint="Dimensions, service requirements, finish — internal and design reference" />
      </FormSection>
      <FormSection title="Pricing">
        <FormRow cols={3}>
          <MoneyField name="cost_price" label="Cost price" defaultValue={equipment?.cost_price ?? ""} hint="Never shown to customers" />
          <MoneyField name="sell_price" label="Standard sell price" defaultValue={equipment?.sell_price ?? ""} />
          <SelectField name="vat_rate_key" label="VAT rate" options={vatRates} defaultValue={equipment?.vat_rate_key ?? "standard"} />
        </FormRow>
        <TextArea name="notes" label="Internal notes" optional defaultValue={equipment?.notes ?? ""} rows={2} />
      </FormSection>
      <FormActions>
        <SubmitButton>{equipment ? "Save item" : "Add equipment"}</SubmitButton>
        <ActionLink href={equipment ? `/dashboard/equipment/${equipment.id}` : "/dashboard/equipment"}>Cancel</ActionLink>
      </FormActions>
    </Form>
  );
}
