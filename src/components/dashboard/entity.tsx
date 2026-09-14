import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Record page header: back link, eyebrow (type / number), title, status, actions. */
export function EntityHeader({
  back, eyebrow, title, badge, meta, actions,
}: { back: { href: string; label: string }; eyebrow?: string; title: string; badge?: React.ReactNode; meta?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <Link href={back.href} className="inline-flex items-center gap-1 text-sm text-muted-light hover:text-graphite">
        <ChevronLeft className="size-4" aria-hidden /> {back.label}
      </Link>
      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="eyebrow text-copper-dark">{eyebrow}</p> : null}
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
            {badge}
          </div>
          {meta ? <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-light">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2 md:justify-end">{actions}</div> : null}
      </div>
    </div>
  );
}

/** Link tabs for record workspaces. `current` is the active tab key. */
export function Tabs({ base, tabs, current }: { base: string; tabs: { key: string; label: string; count?: number; disabled?: string }[]; current: string }) {
  return (
    <nav className="no-scrollbar -mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-graphite/10 px-4 md:mx-0 md:px-0" aria-label="Sections">
      {tabs.map((t) => {
        const active = t.key === current;
        const cls = cn(
          "relative flex h-11 shrink-0 items-center gap-2 px-3 text-sm transition-colors",
          active ? "text-graphite after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-copper" : "text-muted-light hover:text-graphite",
        );
        if (t.disabled) {
          return (
            <span key={t.key} className={cn(cls, "cursor-not-allowed opacity-50")} title={t.disabled}>
              {t.label}
              <span className="rounded-full border border-graphite/15 px-1.5 text-[0.625rem] uppercase tracking-wider">{t.disabled}</span>
            </span>
          );
        }
        return (
          <Link key={t.key} href={t.key === "overview" ? base : `${base}/${t.key}`} className={cls} aria-current={active ? "page" : undefined}>
            {t.label}
            {typeof t.count === "number" ? <span className="rounded-full bg-graphite/8 px-1.5 text-xs num-lining">{t.count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function DescriptionList({ items, cols = 2 }: { items: { label: string; value: React.ReactNode }[]; cols?: 1 | 2 | 3 }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-4 text-sm", cols === 2 && "sm:grid-cols-2", cols === 3 && "sm:grid-cols-3")}>
      {items.map((it) => (
        <div key={it.label} className="min-w-0">
          <dt className="text-xs text-muted-light">{it.label}</dt>
          <dd className="mt-0.5 break-words">{it.value ?? <span className="text-muted-light">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ActionLink({ href, children, variant = "outline" }: { href: string; children: React.ReactNode; variant?: "outline" | "copper" | "obsidian" }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
        variant === "outline" && "border border-graphite/25 hover:border-graphite",
        variant === "copper" && "bg-copper text-ivory hover:bg-copper-dark",
        variant === "obsidian" && "bg-obsidian text-ivory hover:bg-graphite",
      )}
    >
      {children}
    </Link>
  );
}
