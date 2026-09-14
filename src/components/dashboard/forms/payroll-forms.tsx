"use client";

import { Form, FormRow, TextField, TextArea, SelectField, DateField, MoneyField, SubmitButton, FormActions } from "../form";
import { savePayPeriod, addAdjustment } from "@/features/payroll/actions";
import { ADJUSTMENT_KINDS } from "@/features/payroll/schema";
import type { Tables } from "@/lib/supabase/types";
import { ActionLink } from "../entity";

export function PayPeriodForm({ period }: { period?: Tables<"pay_periods"> | null }) {
  return (
    <Form action={savePayPeriod.bind(null, period?.id ?? null)}>
      <TextField name="name" label="Period name" defaultValue={period?.name} required autoFocus placeholder="e.g. September 2026 — monthly" />
      <FormRow cols={3}>
        <DateField name="start_date" label="From" defaultValue={period?.start_date} required />
        <DateField name="end_date" label="To" defaultValue={period?.end_date} required />
        <DateField name="pay_date" label="Pay date" optional defaultValue={period?.pay_date ?? ""} />
      </FormRow>
      <TextArea name="notes" label="Notes" optional defaultValue={period?.notes ?? ""} rows={2} />
      <FormActions>
        <SubmitButton>{period ? "Save period" : "Create period"}</SubmitButton>
        <ActionLink href={period ? `/dashboard/payroll/${period.id}` : "/dashboard/payroll"}>Cancel</ActionLink>
      </FormActions>
    </Form>
  );
}

export function AdjustmentForm({ entryId }: { entryId: string }) {
  return (
    <Form action={addAdjustment.bind(null, entryId)} className="flex flex-wrap items-end gap-2 space-y-0">
      <SelectField name="kind" label="Type" options={ADJUSTMENT_KINDS} defaultValue="bonus" className="min-w-44" />
      <TextField name="label" label="Description" required className="min-w-48 flex-1" />
      <MoneyField name="amount" label="Amount" required className="w-32" hint="Deductions are subtracted automatically" />
      <SubmitButton variant="outline">Add</SubmitButton>
    </Form>
  );
}
