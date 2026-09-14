import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { StatusTone } from "@/lib/domain/statuses";
import { cn } from "@/lib/utils/cn";

/** Page header: eyebrow + title + optional actions. */
export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="eyebrow text-copper-dark">{eyebrow}</p> : null}
        <h1 className="font-display mt-1 text-3xl md:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-muted-light">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/** KPI tile. No shadow, hairline border, big display numeral. */
export function Metric({ label, value, hint, href, tone }: { label: string; value: string | number; hint?: string; href?: string; tone?: "default" | "warning" }) {
  const body = (
    <>
      <p className="text-xs text-muted-light">{label}</p>
      <p className={cn("font-display num-lining mt-2 text-4xl leading-none", tone === "warning" && "text-status-warning")}>{value}</p>
      {hint ? <p className="mt-2 text-xs text-muted-light">{hint}</p> : null}
    </>
  );
  const cls = "block rounded-lg border border-graphite/10 bg-white/50 p-4 md:p-5";
  return href ? <Link href={href} className={cn(cls, "transition-colors hover:border-graphite/30")}>{body}</Link> : <div className={cls}>{body}</div>;
}

const TONE: Record<StatusTone, string> = {
  grey: "bg-graphite/8 text-graphite/70",
  blue: "bg-status-info/10 text-status-info",
  amber: "bg-status-warning/12 text-status-warning",
  green: "bg-status-success/12 text-status-success",
  red: "bg-status-danger/10 text-status-danger",
  copper: "bg-copper/12 text-copper-dark",
};

export function StatusBadge({ label, tone = "grey" }: { label: string; tone?: StatusTone }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", TONE[tone])}>{label}</span>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: { label: string; href: string } }) {
  return (
    <div className="rounded-lg border border-dashed border-graphite/20 px-6 py-12 text-center">
      <p className="font-display text-xl">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-sm text-sm text-muted-light">{description}</p> : null}
      {action ? (
        <Link href={action.href} className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-copper-dark">
          {action.label} <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-graphite/10 bg-white/40", className)}>
      <header className="flex items-center justify-between border-b border-graphite/10 px-4 py-3 md:px-5">
        <h2 className="text-sm font-medium">{title}</h2>
        {action}
      </header>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}
