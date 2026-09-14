"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { DASHBOARD_NAV, MOBILE_NAV } from "@/features/dashboard/navigation";
import type { Permission } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils/cn";
import { NavIcon } from "./nav-icon";

/**
 * Mobile: bottom tab bar (Home / Projects / Sales / Staff / More) + a
 * full-screen "More" sheet with the full permission-aware menu.
 */
export function MobileNav({ permissions }: { permissions: Permission[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const allowed = (p?: Permission) => !p || permissions.includes(p);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  const tabs = MOBILE_NAV.filter((t) => allowed(t.permission));

  return (
    <>
      <nav
        aria-label="Dashboard"
        className="fixed inset-x-0 bottom-0 z-40 grid border-t border-graphite/10 bg-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }}
      >
        {tabs.map((t) => {
          const active = t.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(t.href);
          const disabled = t.phase !== undefined;
          const cls = cn("flex h-14 flex-col items-center justify-center gap-1 text-[0.6875rem]", active ? "text-copper-dark" : "text-muted-light", disabled && "opacity-40");
          return disabled ? (
            <span key={t.href} className={cls} aria-disabled>
              <NavIcon name={t.icon} className="size-5" />
              {t.label}
            </span>
          ) : (
            <Link key={t.href} href={t.href} className={cls} aria-current={active ? "page" : undefined}>
              <NavIcon name={t.icon} className="size-5" />
              {t.label}
            </Link>
          );
        })}
        <button type="button" onClick={() => setOpen(true)} className="flex h-14 flex-col items-center justify-center gap-1 text-[0.6875rem] text-muted-light" aria-expanded={open} aria-controls="dash-more">
          <Menu className="size-5" aria-hidden />
          More
        </button>
      </nav>

      <div
        id="dash-more"
        role="dialog"
        aria-modal="true"
        aria-label="All sections"
        className={cn("fixed inset-0 z-50 flex flex-col bg-ivory transition-[opacity,visibility] duration-300 md:hidden", open ? "visible opacity-100" : "invisible opacity-0")}
      >
        <div className="flex h-14 items-center justify-between border-b border-graphite/10 px-4">
          <span className="eyebrow text-copper-dark">Menu</span>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="-mr-2 inline-flex size-11 items-center justify-center rounded-full hover:bg-graphite/5">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
          {DASHBOARD_NAV.map((section, i) => {
            const items = section.items.filter((it) => allowed(it.permission));
            if (!items.length) return null;
            return (
              <div key={i} className="mb-6">
                {section.label ? <p className="eyebrow mb-2 text-muted-light">{section.label}</p> : null}
                <ul className="divide-y divide-graphite/10 border-y border-graphite/10">
                  {items.map((item) => {
                    const disabled = item.phase !== undefined;
                    const inner = (
                      <>
                        <NavIcon name={item.icon} className="size-5 text-muted-light" />
                        <span className="flex-1">{item.label}</span>
                        {disabled ? <span className="text-xs text-muted-light">Phase {item.phase}</span> : null}
                      </>
                    );
                    return (
                      <li key={item.href}>
                        {disabled ? (
                          <span className="flex min-h-12 items-center gap-3 opacity-50">{inner}</span>
                        ) : (
                          <Link href={item.href} className="flex min-h-12 items-center gap-3">
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
        </div>
      </div>
    </>
  );
}
