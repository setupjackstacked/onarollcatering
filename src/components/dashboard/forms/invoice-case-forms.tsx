"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Form, FormRow, TextField, SelectField, SubmitButton } from "../form";
import { setStage, addCaseNote, assignInvoice } from "@/features/invoices/actions";
import { INVOICE_STAGES } from "@/features/invoices/schema";

type Opt = { value: string; label: string };

/** Move the case to any stage, with a note explaining why. Real approval chains
 *  loop backwards as often as forwards, so every stage is reachable. */
export function StageForm({ id, current }: { id: string; current: string }) {
  const [stage, setStageValue] = useState(current);
  return (
    <Form action={setStage.bind(null, id, stage)} className="space-y-4">
      <FormRow>
        <SelectField name="stage_display" label="Move to" value={stage} onChange={(e) => setStageValue(e.target.value)}
          options={INVOICE_STAGES.map((s) => ({ value: s.value, label: s.label }))} />
        <TextField name="note" label="Note" optional placeholder="e.g. signed by M. Byrne on site" />
      </FormRow>
      <SubmitButton disabled={stage === current}>Update stage</SubmitButton>
    </Form>
  );
}

export function CaseNoteForm({ id }: { id: string }) {
  return (
    <Form action={addCaseNote.bind(null, id)} className="flex flex-wrap items-end gap-3 space-y-0">
      <TextField name="note" label="Add a note to the history" required className="min-w-64 flex-1" />
      <SubmitButton variant="outline">Add note</SubmitButton>
    </Form>
  );
}

export function CaseDetailsForm({ id, members, sites, assignedTo, siteId, reference }: {
  id: string; members: Opt[]; sites: Opt[]; assignedTo: string | null; siteId: string | null; reference: string | null;
}) {
  return (
    <Form action={assignInvoice.bind(null, id)}>
      <FormRow cols={3}>
        <SelectField name="assigned_to" label="Owned by" optional options={members} placeholder="Nobody" defaultValue={assignedTo ?? ""}
          hint="Who is chasing this" />
        <SelectField name="site_id" label="Site" optional options={sites} placeholder="No site" defaultValue={siteId ?? ""} />
        <TextField name="client_reference" label="Client PO / reference" optional defaultValue={reference ?? ""} />
      </FormRow>
      <SubmitButton variant="outline">Save</SubmitButton>
    </Form>
  );
}

type PackResult = {
  filename: string; version: number; pages: number;
  included: { name: string; pages: number }[];
  skipped: { name: string; reason: string }[];
  documentId: string;
};

/**
 * Builds the single PDF for the client's finance department. Reports exactly
 * what went in and what couldn't be merged, rather than quietly producing a
 * pack with something missing.
 */
export function GeneratePackButton({ id, hasPack }: { id: string; hasPack: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<PackResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <button type="button" disabled={pending}
        onClick={() => start(async () => {
          setError(null); setResult(null);
          const res = await fetch(`/api/invoices/${id}/pack`, { method: "POST" });
          const json = (await res.json().catch(() => ({}))) as PackResult & { error?: string };
          if (!res.ok) { setError(json.error ?? "Couldn’t generate the pack."); return; }
          setResult(json);
          router.refresh();
        })}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-copper px-5 text-sm font-medium text-ivory hover:bg-copper-dark disabled:opacity-60">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {hasPack ? "Generate a new version" : "Generate final payment pack"}
      </button>

      {error ? <p role="alert" className="rounded-md bg-status-danger/10 px-4 py-3 text-sm text-status-danger">{error}</p> : null}

      {result ? (
        <div role="status" className="rounded-md bg-status-success/10 px-4 py-3 text-sm">
          <p className="font-medium">Version {result.version} generated — {result.pages} pages.</p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs">
            {result.included.map((i) => <li key={i.name}>{i.name} ({i.pages} {i.pages === 1 ? "page" : "pages"})</li>)}
          </ul>
          {result.skipped.length ? (
            <div className="mt-2 rounded-md bg-status-warning/15 px-3 py-2">
              <p className="text-xs font-medium">Left out of the pack:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
                {result.skipped.map((s) => <li key={s.name}>{s.name} — {s.reason}</li>)}
              </ul>
            </div>
          ) : null}
          <p className="mt-2"><a href={`/api/documents/${result.documentId}`} className="underline">Download {result.filename}</a></p>
        </div>
      ) : null}
    </div>
  );
}
