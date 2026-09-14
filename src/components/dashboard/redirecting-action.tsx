"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** Button for server actions that return { redirectTo } or { error }. */
export function RedirectingAction({ action, label, variant = "outline" }: { action: () => Promise<{ redirectTo?: string; error?: string } | void>; label: string; variant?: "outline" | "copper" }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { const r = await action(); if (r && "redirectTo" in r && r.redirectTo) router.push(r.redirectTo); else if (r && "error" in r && r.error) alert(r.error); else router.refresh(); })}
      className={variant === "copper" ? "inline-flex h-10 items-center gap-2 rounded-full bg-copper px-4 text-sm font-medium text-ivory hover:bg-copper-dark disabled:opacity-60" : "inline-flex h-10 items-center gap-2 rounded-full border border-graphite/25 px-4 text-sm font-medium hover:border-graphite disabled:opacity-60"}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}{label}
    </button>
  );
}
