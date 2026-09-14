"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Destructive action with an in-page confirmation dialog (spec §74).
 * `action` is a bound server action.
 */
export function ConfirmAction({
  action, label, title, description, confirmLabel = "Confirm", variant = "danger", className,
}: { action: () => Promise<unknown>; label: string; title: string; description?: string; confirmLabel?: string; variant?: "danger" | "outline"; className?: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-10 items-center rounded-full px-4 text-sm font-medium",
          variant === "danger" ? "border border-status-danger/40 text-status-danger hover:bg-status-danger/10" : "border border-graphite/25 hover:border-graphite",
          className,
        )}
      >
        {label}
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-obsidian/40 p-4 backdrop-blur-sm sm:items-center" onClick={() => !pending && setOpen(false)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-xl bg-ivory p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 id="confirm-title" className="font-display text-2xl">{title}</h2>
            {description ? <p className="mt-2 text-sm text-muted-light">{description}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} disabled={pending} className="h-10 rounded-full border border-graphite/25 px-4 text-sm">
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => start(async () => { await action(); setOpen(false); })}
                className={cn("inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-ivory", variant === "danger" ? "bg-status-danger" : "bg-obsidian")}
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
