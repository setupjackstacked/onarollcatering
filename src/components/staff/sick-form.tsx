"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip } from "lucide-react";
import { Form, FormRow, TextArea, DateField, SubmitButton } from "@/components/dashboard/form";
import { reportSickness, attachSickNote } from "@/features/staff/actions";
import { DOC_ACCEPT } from "@/features/documents/shared";

/**
 * Reporting sickness is two steps on purpose: the absence is recorded first so
 * the manager knows straight away, then the note is uploaded — usually later,
 * once the person has been to a doctor.
 */
export function ReportSickForm() {
  return (
    <Form action={reportSickness}>
      <FormRow>
        <DateField name="start_date" label="First day off" required />
        <DateField name="end_date" label="Expected last day" required hint="Change it later if you're out for longer" />
      </FormRow>
      <TextArea name="reason" label="What's wrong (optional)" optional rows={2} placeholder="Your manager sees this" />
      <p className="rounded-md bg-status-warning/10 px-4 py-3 text-sm">
        A doctor’s note is needed for every sick absence. You can send the absence now and upload the note when you have it.
      </p>
      <SubmitButton variant="copper" className="h-12 w-full">Report sickness</SubmitButton>
    </Form>
  );
}

/** Uploads the note against the absence. Same upload route as every other document. */
export function SickNoteUpload({ leaveId, employeeId }: { leaveId: string; employeeId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input ref={ref} type="file" accept={DOC_ACCEPT} className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        start(async () => {
          setError(null);
          const fd = new FormData();
          fd.append("file", file);
          fd.append("entityType", "employee");
          fd.append("entityId", employeeId);
          fd.append("category", "sick-note");
          const res = await fetch("/api/documents/upload", { method: "POST", body: fd });
          const json = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
          if (!res.ok || !json.id) { setError(json.error ?? "Upload failed. Please try again."); return; }
          const r = await attachSickNote(leaveId, json.id);
          if (r?.error) { setError(r.error); return; }
          router.refresh();
        });
      }} />
      <button type="button" disabled={pending} onClick={() => ref.current?.click()}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-copper px-5 text-sm font-medium text-ivory disabled:opacity-60">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
        Upload doctor’s note
      </button>
      <p className="mt-2 text-xs text-muted-light">A photo of the note is fine — JPG, PNG or PDF.</p>
      {error ? <p className="mt-2 text-sm text-status-danger">{error}</p> : null}
    </div>
  );
}
