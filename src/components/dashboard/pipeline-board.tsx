"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { moveLead } from "@/features/leads/actions";
import { OPEN_LEAD_STATUSES, LEAD_STATUSES } from "@/lib/domain/statuses";
import { formatMoney } from "@/lib/money";
import { RelativeTime } from "./relative-time";
import { cn } from "@/lib/utils/cn";

export type BoardLead = { id: string; title: string; status: string; company: string; value: number; assignee: string; updated: string };

/**
 * Kanban-style pipeline. Horizontal scroll on every size; cards move with
 * arrow buttons (touch-friendly, keyboard accessible) rather than drag-drop.
 */
export function PipelineBoard({ leads, canMove }: { leads: BoardLead[]; canMove: boolean }) {
  const [optimistic, apply] = useOptimistic(leads, (state, { id, status }: { id: string; status: string }) => state.map((l) => (l.id === id ? { ...l, status } : l)));
  const [, start] = useTransition();
  const cols = OPEN_LEAD_STATUSES;
  const move = (id: string, dir: -1 | 1, current: string) => {
    const idx = cols.indexOf(current as (typeof cols)[number]);
    const next = cols[idx + dir];
    if (!next) return;
    start(async () => {
      apply({ id, status: next });
      await moveLead(id, next);
    });
  };

  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
      {cols.map((status, ci) => {
        const items = optimistic.filter((l) => l.status === status);
        const total = items.reduce((s, l) => s + l.value, 0);
        const label = LEAD_STATUSES.find((s) => s.value === status)?.label ?? status;
        return (
          <section key={status} className="flex w-[82vw] shrink-0 snap-start flex-col rounded-lg border border-graphite/10 bg-graphite/[0.03] sm:w-72" aria-label={label}>
            <header className="flex items-baseline justify-between px-3 py-2.5">
              <h2 className="text-sm font-medium">{label} <span className="ml-1 text-xs text-muted-light num-lining">{items.length}</span></h2>
              {total ? <span className="text-xs text-muted-light num-lining">{formatMoney(total, { showPence: false })}</span> : null}
            </header>
            <ul className="flex-1 space-y-2 px-2 pb-2">
              {items.map((l) => (
                <li key={l.id} className="rounded-md border border-graphite/10 bg-ivory p-3">
                  <Link href={`/dashboard/leads/${l.id}`} className="block text-sm font-medium leading-snug hover:underline">{l.title}</Link>
                  <p className="mt-1 truncate text-xs text-muted-light">{l.company || "No company"}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-light">
                    <span className="num-lining">{l.value ? formatMoney(l.value, { showPence: false }) : "—"}</span>
                    <span>{l.assignee !== "—" ? l.assignee : ""}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <RelativeTime value={l.updated} className="text-[0.6875rem] text-muted-light" />
                    {canMove ? (
                      <span className="flex gap-1">
                        <button type="button" disabled={ci === 0} onClick={() => move(l.id, -1, l.status)} aria-label="Move back" className={cn("inline-flex size-7 items-center justify-center rounded-full border border-graphite/15 hover:border-graphite", ci === 0 && "opacity-30")}><ChevronLeft className="size-3.5" /></button>
                        <button type="button" disabled={ci === cols.length - 1} onClick={() => move(l.id, 1, l.status)} aria-label="Move forward" className={cn("inline-flex size-7 items-center justify-center rounded-full border border-graphite/15 hover:border-graphite", ci === cols.length - 1 && "opacity-30")}><ChevronRight className="size-3.5" /></button>
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
              {!items.length ? <li className="px-1 py-4 text-center text-xs text-muted-light">Empty</li> : null}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
