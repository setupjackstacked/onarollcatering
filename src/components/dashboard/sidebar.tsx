"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { DASHBOARD_NAV } from "@/features/dashboard/navigation";
import type { Permission } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils/cn";
import { NavIcon } from "./nav-icon";
import { Logo } from "@/components/marketing/logo";

type Props = {
  permissions: Permission[];
  collapsed: boolean;
  onToggle: () => void;
  orgName: string;
};

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname === href || pathname.startsWith(href + "/");
}

/** Desktop / tablet sidebar. Permission-aware; future modules shown disabled with their phase. */
export function Sidebar({ permissions, collapsed, onToggle, orgName }: Props) {
  const pathname = usePathname();
  const allowed = (p?: Permission) => !p || permissions.includes(p);

  return (
    <aside
      className={cn(
        "hidden md:flex h-dvh sticky top-0 shrink-0 flex-col border-r border-graphite/10 bg-white/50 transition-[width] duration-300 ease-premium",
        collapsed ? "w-[4.25rem]" : "w-64",
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-graphite/10", collapsed ? "justify-center px-2" : "justify-between px-4")}>
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden" aria-label="Overview">
          <Logo variant="mark" className="h-8 shrink-0" />
          {!collapsed ? <span className="truncate text-sm font-medium">{orgName}</span> : null}
        </Link>
        {!collapsed ? (
          <button type="button" onClick={onToggle} aria-label="Collapse sidebar" className="rounded-md p-1.5 text-muted-light hover:bg-graphite/5 hover:text-graphite">
            <PanelLeftClose className="size-4" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Dashboard">
        {DASHBOARD_NAV.map((section, i) => {
          const items = section.items.filter((it) => allowed(it.permission));
          if (!items.length) return null;
          return (
            <div key={i} className={cn(i > 0 && "mt-5")}>
              {section.label && !collapsed ? <p className="eyebrow mb-2 px-3 text-muted-light/80">{section.label}</p> : null}
              {section.label && collapsed ? <div className="mx-3 mb-2 h-px bg-graphite/10" /> : null}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const disabled = item.phase !== undefined;
                  const inner = (
                    <>
                      <NavIcon name={item.icon} className={cn("size-[18px] shrink-0", active ? "text-copper-dark" : "text-muted-light")} />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                      {!collapsed && disabled ? <span className="ml-auto rounded-full border border-graphite/15 px-1.5 text-[0.625rem] uppercase tracking-wider text-muted-light">P{item.phase}</span> : null}
                    </>
                  );
                  const cls = cn(
                    "flex h-10 items-center gap-3 rounded-md px-3 text-[0.875rem] transition-colors",
                    collapsed && "justify-center px-0",
                    active ? "bg-copper/10 font-medium text-graphite" : "text-graphite/80 hover:bg-graphite/5 hover:text-graphite",
                    disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
                  );
                  return (
                    <li key={item.href}>
                      {disabled ? (
                        <span className={cls} title={`${item.label} — Phase ${item.phase}`} aria-disabled>
                          {inner}
                        </span>
                      ) : (
                        <Link href={item.href} className={cls} aria-current={active ? "page" : undefined} title={collapsed ? item.label : undefined}>
                          {inner}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {collapsed ? (
        <button type="button" onClick={onToggle} aria-label="Expand sidebar" className="m-2 flex h-10 items-center justify-center rounded-md text-muted-light hover:bg-graphite/5 hover:text-graphite">
          <PanelLeftOpen className="size-4" />
        </button>
      ) : null}
    </aside>
  );
}
