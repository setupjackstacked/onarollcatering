import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function Breadcrumbs({ items, className, tone = "light" }: { items: { name: string; href: string }[]; className?: string; tone?: "light" | "dark" }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className={cn("flex flex-wrap items-center gap-2 text-xs", tone === "dark" ? "text-ivory/50" : "text-muted-light")}>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-2">
              {last ? (
                <span aria-current="page" className={tone === "dark" ? "text-ivory/80" : "text-graphite"}>
                  {item.name}
                </span>
              ) : (
                <Link href={item.href} className="transition-colors hover:text-copper">
                  {item.name}
                </Link>
              )}
              {!last ? <span aria-hidden>/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
