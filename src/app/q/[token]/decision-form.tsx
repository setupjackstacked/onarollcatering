"use client";

import { useActionState } from "react";
import { submitDecision } from "./actions";
import type { FormState } from "@/lib/forms";

export function DecisionForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(submitDecision, {} as FormState);
  if (state.success) return <p role="status" className="rounded-md bg-status-success/10 px-4 py-3 text-sm text-status-success">{state.success}</p>;
  const control = "h-11 w-full rounded-md border border-graphite/20 bg-white px-3 text-sm focus:border-copper focus:outline-none";
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm"><span className="mb-1 block font-medium">Your name</span><input name="name" required className={control} autoComplete="name" />{state.fieldErrors?.name ? <span className="text-xs text-status-danger">{state.fieldErrors.name[0]}</span> : null}</label>
        <label className="text-sm sm:col-span-2"><span className="mb-1 block font-medium">Message <span className="text-muted-light">(optional)</span></span><textarea name="note" rows={3} className="w-full rounded-md border border-graphite/20 bg-white px-3 py-2 text-sm focus:border-copper focus:outline-none" /></label>
      </div>
      {state.error ? <p role="alert" className="text-sm text-status-danger">{state.error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" name="decision" value="accept" disabled={pending} className="h-12 rounded-full bg-copper px-6 text-sm font-medium text-ivory hover:bg-copper-dark disabled:opacity-60">Accept quotation</button>
        <button type="submit" name="decision" value="decline" disabled={pending} className="h-12 rounded-full border border-graphite/25 px-6 text-sm font-medium hover:border-graphite disabled:opacity-60">Decline</button>
      </div>
    </form>
  );
}
