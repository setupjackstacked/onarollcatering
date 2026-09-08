import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/** Horizontal scrolling filter chips (server-rendered links, no JS). */
export function ProjectFilters({ categories, active }: { categories: readonly string[]; active: string | null }) {
  const chip = (label: string, href: string, isActive: boolean) => (
    <li key={label} className="shrink-0">
      <Link
        href={href}
        scroll={false}
        aria-current={isActive ? "true" : undefined}
        className={cn(
          "inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors",
          isActive ? "border-graphite bg-graphite text-ivory" : "border-graphite/20 text-graphite hover:border-graphite",
        )}
      >
        {label}
      </Link>
    </li>
  );
  return (
    <nav aria-label="Filter projects">
      <ul className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
        {chip("All", "/projects", active === null)}
        {categories.map((c) => chip(c, `/projects?category=${encodeURIComponent(c)}`, active === c))}
      </ul>
    </nav>
  );
}
