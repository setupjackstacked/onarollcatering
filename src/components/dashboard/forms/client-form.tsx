"use client";

import { Form, FormRow, FormSection, TextField, TextArea, SelectField, CheckboxField, SubmitButton, FormActions } from "../form";
import { saveClient } from "@/features/clients/actions";
import type { Tables } from "@/lib/supabase/types";
import type { Address } from "@/lib/domain/address";
import { ActionLink } from "../entity";

type Props = { client?: Tables<"clients"> | null; members: { value: string; label: string }[] };

export function ClientForm({ client, members }: Props) {
  const b = (client?.billing_address ?? {}) as Partial<Address>;
  const t = (client?.trading_address ?? {}) as Partial<Address>;
  const sameAddress = !client || JSON.stringify(b) === JSON.stringify(t);
  return (
    <Form action={saveClient.bind(null, client?.id ?? null)}>
      <FormSection title="Company">
        <FormRow>
          <TextField name="name" label="Company name" defaultValue={client?.name} required autoFocus />
          <TextField name="legal_name" label="Legal name" optional defaultValue={client?.legal_name ?? ""} />
          <TextField name="company_number" label="Company number" optional defaultValue={client?.company_number ?? ""} />
          <TextField name="vat_number" label="VAT number" optional defaultValue={client?.vat_number ?? ""} />
        </FormRow>
      </FormSection>
      <FormSection title="Contact details">
        <FormRow cols={3}>
          <TextField name="email" label="Email" type="email" optional defaultValue={client?.email ?? ""} />
          <TextField name="phone" label="Phone" type="tel" optional defaultValue={client?.phone ?? ""} />
          <TextField name="website" label="Website" optional defaultValue={client?.website ?? ""} placeholder="https://" />
        </FormRow>
      </FormSection>
      <FormSection title="Commercial">
        <FormRow>
          <TextField name="payment_terms_days" label="Payment terms (days)" type="number" min={0} max={365} defaultValue={client?.payment_terms_days ?? 30} />
          <SelectField name="owner_user_id" label="Account owner" optional options={members} placeholder="Unassigned" defaultValue={client?.owner_user_id ?? ""} />
        </FormRow>
      </FormSection>
      <FormSection title="Billing address">
        <FormRow>
          <TextField name="billing_line1" label="Address line 1" optional defaultValue={b.line1 ?? ""} />
          <TextField name="billing_line2" label="Address line 2" optional defaultValue={b.line2 ?? ""} />
          <TextField name="billing_city" label="Town / city" optional defaultValue={b.city ?? ""} />
          <TextField name="billing_county" label="County" optional defaultValue={b.county ?? ""} />
          <TextField name="billing_postcode" label="Postcode" optional defaultValue={b.postcode ?? ""} />
        </FormRow>
      </FormSection>
      <FormSection title="Trading address">
        <CheckboxField name="trading_same" label="Same as billing address" defaultChecked={sameAddress} />
        <FormRow>
          <TextField name="trading_line1" label="Address line 1" optional defaultValue={t.line1 ?? ""} />
          <TextField name="trading_line2" label="Address line 2" optional defaultValue={t.line2 ?? ""} />
          <TextField name="trading_city" label="Town / city" optional defaultValue={t.city ?? ""} />
          <TextField name="trading_county" label="County" optional defaultValue={t.county ?? ""} />
          <TextField name="trading_postcode" label="Postcode" optional defaultValue={t.postcode ?? ""} />
        </FormRow>
      </FormSection>
      <FormSection title="Notes">
        <TextArea name="notes" label="Internal notes" optional defaultValue={client?.notes ?? ""} />
      </FormSection>
      <FormActions>
        <SubmitButton>{client ? "Save changes" : "Create client"}</SubmitButton>
        <ActionLink href={client ? `/dashboard/clients/${client.id}` : "/dashboard/clients"}>Cancel</ActionLink>
      </FormActions>
    </Form>
  );
}
