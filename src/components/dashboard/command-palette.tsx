"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, CornerDownLeft } from "lucide-react";
import { searchDashboard, type SearchGroup } from "@/features/dashboard/search";
import { cn } from "@/lib/utils/cn";

/** ⌘K / Ctrl-K global search. Debounced server-action search, grouped results, keyboard navigation. */
export function CommandPalette({ open, onOpenChange, available }: { open: boolean; onOpenChange: (o: boolean) => void; available: boolean }) {
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [active, setActive] = useState(0);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      startTransition(async () => {
        const res = query.trim().length >= 2 ? await searchDashboard(query) : [];
        setGroups(res);
        setActive(0);
      });
    }, 180);
    return () => clearTimeout(t);
  }, [query, open]);

  const flat = groups.flatMap((g) => g.results.map((r) => ({ ...r, group: g.label })));

  const go = (href: string) => {
    onOpenChange(false);
    setQuery("");
    if (available) router.push(href);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-obsidian/40 p-4 pt-[12vh] backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <div role="dialog" aria-modal="true" aria-label="Search" className="w-full max-w-xl overflow-hidden rounded-xl bg-ivory shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-graphite/10 px-4">
          {pending ? <Loader2 className="size-5 animate-spin text-muted-light" aria-hidden /> : <Search className="size-5 text-muted-light" aria-hidden />}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, flat.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === "Enter" && flat[active]) go(flat[active]!.href);
            }}
            placeholder="Search clients, contacts, projects, leads, sites…"
            aria-label="Search"
            className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted-light/70"
          />
          <kbd className="hidden rounded border border-graphite/15 px-1.5 py-0.5 text-[0.625rem] text-muted-light sm:block">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {query.trim().length < 2 ? (
            <p className="px-4 py-6 text-sm text-muted-light">Type at least two characters.</p>
          ) : !pending && flat.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-light">No results for “{query}”.</p>
          ) : (
            groups.map((g) => (
              <div key={g.entity} className="px-2 py-1">
                <p className="eyebrow px-2 py-1 text-muted-light">{g.label}</p>
                <ul>
                  {g.results.map((r) => {
                    const idx = flat.findIndex((f) => f.id === r.id && f.group === g.label);
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => go(r.href)}
                          className={cn("flex w-full items-center gap-3 rounded-md px-2 py-2 text-left", idx === active ? "bg-copper/10" : "hover:bg-graphite/5")}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{r.title}</span>
                            {r.subtitle ? <span className="block truncate text-xs text-muted-light">{r.subtitle}</span> : null}
                          </span>
                          {idx === active ? <CornerDownLeft className="size-4 text-muted-light" aria-hidden /> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
        {!available ? <p className="border-t border-graphite/10 px-4 py-2 text-xs text-muted-light">Record pages open in Phase 4 — search is live against the database now.</p> : null}
      </div>
    </div>
  );
}
