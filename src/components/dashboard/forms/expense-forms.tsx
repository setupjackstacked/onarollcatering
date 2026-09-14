"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip } from "lucide-react";
import { Form, FormRow, FormSection, TextField, TextArea, SelectField, DateField, MoneyField, SubmitButton, FormActions, Hidden } from "../form";
import { saveExpense, saveEstimate, attachReceipt } from "@/features/expenses/actions";
import { COST_CATEGORIES, EXPENSE_STATUSES } from "@/features/expenses/schema";
import { DOC_ACCEPT } from "@/features/documents/shared";
import type { Tables } from "@/lib/supabase/types";
import { ActionLink } from "../entity";

type Opt = { value: string; label: string };

export function ExpenseForm({ expense, projects, suppliers, canApprove, defaults, returnTo }: { expense?: Tables<"expenses"> | null; projects: Opt[]; suppliers: Opt[]; canApprove: boolean; defaults?: { project_id?: string; expense_date?: string; supplier_id?: string }; returnTo?: string }) {
  return (
    <Form action={saveExpense.bind(null, expense?.id ?? null)}>
      {returnTo ? <Hidden name="return" value={returnTo} /> : null}
      <FormSection title="Cost">
        <TextField name="description" label="Description" defaultValue={expense?.description} required autoFocus placeholder="e.g. Weekly food delivery — North Compound" />
        <FormRow cols={3}>
          <SelectField name="project_id" label="Project" optional={canApprove} options={projects} placeholder={canApprove ? "Overhead (no project)" : "Select a project"} defaultValue={expense?.project_id ?? defaults?.project_id ?? ""} />
          <SelectField name="category" label="Category" options={COST_CATEGORIES as unknown as Opt[]} defaultValue={expense?.category ?? "other"} />
          <DateField name="expense_date" label="Date" defaultValue={expense?.expense_date ?? defaults?.expense_date} required />
        </FormRow>
        <FormRow cols={3}>
          <MoneyField name="net" label="Net" defaultValue={expense?.net ?? ""} required />
          <MoneyField name="vat" label="VAT" defaultValue={expense?.vat ?? ""} hint="Enter 0 if not VAT-able" />
          {canApprove ? <SelectField name="status" label="Status" options={EXPENSE_STATUSES as unknown as Opt[]} defaultValue={expense?.status ?? "actual"} hint="Committed = agreed / PO raised; Actual = invoice received" /> : <div className="text-sm text-muted-light sm:pt-7">Submitted for finance approval</div>}
        </FormRow>
      </FormSection>
      <FormSection title="Supplier and reference">
        <FormRow cols={3}>
          {suppliers.length ? <SelectField name="supplier_id" label="Supplier" optional options={suppliers} placeholder="None / not listed" defaultValue={expense?.supplier_id ?? defaults?.supplier_id ?? ""} /> : null}
          <TextField name="supplier_name" label={suppliers.length ? "Supplier (if not listed)" : "Supplier"} optional defaultValue={expense?.supplier_name ?? ""} />
          <TextField name="reference" label="Invoice / PO reference" optional defaultValue={expense?.reference ?? ""} />
        </FormRow>
        <TextArea name="notes" label="Notes" optional defaultValue={expense?.notes ?? ""} rows={3} />
      </FormSection>
      <FormActions>
        <SubmitButton>{expense ? "Save cost" : "Record cost"}</SubmitButton>
        <ActionLink href={returnTo ?? (expense ? `/dashboard/expenses/${expense.id}` : "/dashboard/expenses")}>Cancel</ActionLink>
      </FormActions>
    </Form>
  );
}

export function EstimateForm({ projectId, existing }: { projectId: string; existing: { category: string; amount: string; notes: string | null }[] }) {
  const [cat, setCat] = useState(existing[0]?.category ?? "labour");
  const current = existing.find((e) => e.category === cat);
  return (
    <Form action={saveEstimate.bind(null, projectId)} className="flex flex-wrap items-end gap-3 space-y-0">
      <SelectField name="category" label="Category" options={COST_CATEGORIES as unknown as Opt[]} value={cat} onChange={(e) => setCat(e.target.value)} className="min-w-44" />
      <MoneyField key={cat} name="amount" label="Estimated cost" defaultValue={current?.amount ?? ""} className="w-40" />
      <TextField key={`n-${cat}`} name="notes" label="Note" optional defaultValue={current?.notes ?? ""} className="min-w-48 flex-1" />
      <SubmitButton variant="outline">Save estimate</SubmitButton>
    </Form>
  );
}

export function ReceiptUpload({ expenseId, projectId }: { expenseId: string; projectId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input ref={ref} type="file" accept={DOC_ACCEPT} className="hidden" onChange={(e) => {
        const f = e.target.files?.[0]; if (!f) return;
        start(async () => {
          setError(null);
          const fd = new FormData(); fd.append("file", f); fd.append("entityType", "project"); fd.append("entityId", projectId); fd.append("category", "receipts");
          const res = await fetch("/api/documents/upload", { method: "POST", body: fd });
          const j = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
          if (!res.ok || !j.id) { setError(j.error ?? "Upload failed"); return; }
          await attachReceipt(expenseId, j.id);
          router.refresh();
        });
      }} />
      <button type="button" disabled={pending} onClick={() => ref.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-full border border-graphite/25 px-4 text-sm font-medium hover:border-graphite disabled:opacity-60">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />} Attach receipt
      </button>
      {error ? <p className="mt-2 text-xs text-status-danger">{error}</p> : null}
    </div>
  );
}
