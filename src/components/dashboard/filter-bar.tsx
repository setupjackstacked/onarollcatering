"use client";

import { Suspense, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type FilterDef = { name: string; label: string; options: { value: string; label: string }[] };

/**
 * GET-based filters (URL is the state, so lists are shareable + back-button safe).
 * Selects auto-submit; the search box submits on Enter / blur.
 */
export function FilterBar(props: { filters: FilterDef[]; searchPlaceholder?: string; showSearch?: boolean }) {
  // useSearchParams needs a Suspense boundary for static prerendering.
  return (
    <Suspense fallback={<div className="mb-5 h-10" />}>
      <FilterBarInner {...props} />
    </Suspense>
  );
}

function FilterBarInner({ filters, searchPlaceholder = "Search…", showSearch = true }: { filters: FilterDef[]; searchPlaceholder?: string; showSearch?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  const submit = () => {
    const fd = new FormData(formRef.current!);
    const next = new URLSearchParams();
    for (const [k, v] of fd.entries()) if (typeof v === "string" && v) next.set(k, v);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`);
  };
  const hasFilters = [...params.keys()].some((k) => k !== "page");

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0"
    >
      {showSearch ? (
        <label className="relative flex min-w-56 flex-1 items-center md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 size-4 text-muted-light" aria-hidden />
          <input
            name="q"
            defaultValue={params.get("q") ?? ""}
            placeholder={searchPlaceholder}
            onBlur={submit}
            className="h-10 w-full rounded-full border border-graphite/20 bg-white/60 pl-9 pr-3 text-sm focus:border-copper focus:outline-none"
            aria-label="Search"
          />
        </label>
      ) : null}
      {filters.map((f) => (
        <select
          key={f.name}
          name={f.name}
          defaultValue={params.get(f.name) ?? ""}
          onChange={submit}
          aria-label={f.label}
          className={cn("h-10 shrink-0 rounded-full border border-graphite/20 bg-white/60 px-3 text-sm focus:border-copper focus:outline-none", params.get(f.name) && "border-copper bg-copper/5")}
        >
          <option value="">{f.label}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
      {hasFilters ? (
        <button type="button" onClick={() => router.replace(pathname)} className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-3 text-sm text-muted-light hover:text-graphite">
          <X className="size-4" aria-hidden /> Clear
        </button>
      ) : null}
    </form>
  );
}
