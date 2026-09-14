"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Search, LogOut, ChevronDown } from "lucide-react";
import type { Permission } from "@/lib/auth/permissions";
import { signOut } from "@/features/auth/actions";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { CommandPalette } from "./command-palette";
import { Logo } from "@/components/marketing/logo";
import { cn } from "@/lib/utils/cn";

type Props = {
  orgName: string;
  userEmail: string;
  roleLabel: string;
  permissions: Permission[];
  unreadNotifications: number;
  children: React.ReactNode;
};

const COLLAPSE_KEY = "oar:sidebar-collapsed";

/** Dashboard chrome: sidebar (desktop), top utility bar, mobile bottom nav, ⌘K palette. */
export function DashboardShell({ orgName, userEmail, roleLabel, permissions, unreadNotifications, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const id = requestAnimationFrame(() => setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"));
      return () => cancelAnimationFrame(id);
    } catch {}
  }, []);
  const toggle = () => {
    setCollapsed((c) => {
      try { localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1"); } catch {}
      return !c;
    });
  };

  return (
    <div className="flex min-h-dvh bg-ivory text-graphite">
      <Sidebar permissions={permissions} collapsed={collapsed} onToggle={toggle} orgName={orgName} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-graphite/10 bg-ivory/90 px-4 backdrop-blur md:h-16 md:px-6">
          <Link href="/dashboard" className="md:hidden" aria-label="Overview">
            <Logo variant="mark" className="h-7" />
          </Link>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="ml-auto flex h-10 items-center gap-2 rounded-full border border-graphite/15 bg-white/50 px-3 text-sm text-muted-light transition-colors hover:border-graphite/40 md:ml-0 md:w-80"
            aria-label="Search"
          >
            <Search className="size-4" aria-hidden />
            <span className="hidden md:inline">Search…</span>
            <kbd className="ml-auto hidden rounded border border-graphite/15 px-1.5 text-[0.625rem] md:inline">⌘K</kbd>
          </button>

          <div className="flex items-center gap-1 md:ml-auto">
            <Link href="/dashboard/notifications" className="relative inline-flex size-10 items-center justify-center rounded-full text-muted-light hover:bg-graphite/5 hover:text-graphite" aria-label={`Notifications${unreadNotifications ? ` (${unreadNotifications} unread)` : ""}`}>
              <Bell className="size-5" aria-hidden />
              {unreadNotifications > 0 ? (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-copper px-1 text-[0.625rem] font-medium text-ivory">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>
              ) : null}
            </Link>

            <div className="relative">
              <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen} className="flex h-10 items-center gap-2 rounded-full pl-1 pr-2 hover:bg-graphite/5">
                <span className="flex size-8 items-center justify-center rounded-full bg-obsidian text-xs font-medium uppercase text-ivory">{userEmail.slice(0, 1)}</span>
                <span className="hidden max-w-[10rem] truncate text-sm md:block">{userEmail}</span>
                <ChevronDown className="hidden size-4 text-muted-light md:block" aria-hidden />
              </button>
              {menuOpen ? (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div role="menu" className="absolute right-0 z-50 mt-2 w-60 rounded-lg border border-graphite/10 bg-ivory p-1 shadow-lg">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-medium">{userEmail}</p>
                      <p className="text-xs text-muted-light">{roleLabel} · {orgName}</p>
                    </div>
                    <Link role="menuitem" href="/dashboard/settings" className="block rounded-md px-3 py-2 text-sm hover:bg-graphite/5" onClick={() => setMenuOpen(false)}>Settings</Link>
                    <form action={signOut}>
                      <button role="menuitem" type="submit" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-graphite/5">
                        <LogOut className="size-4 text-muted-light" aria-hidden /> Sign out
                      </button>
                    </form>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <main className={cn("flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-12 md:pt-8")}>{children}</main>
      </div>

      <MobileNav permissions={permissions} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} available />
    </div>
  );
}
