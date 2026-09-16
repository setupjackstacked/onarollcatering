"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Home, MessageSquare, Plane, Utensils } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { href: "/staff", label: "Today", icon: Home },
  { href: "/staff/timesheets", label: "Hours", icon: Clock },
  { href: "/staff/vouchers", label: "Vouchers", icon: Utensils },
  { href: "/staff/leave", label: "Leave", icon: Plane },
  { href: "/staff/messages", label: "Messages", icon: MessageSquare },
];

/** Bottom tab bar — thumb-reachable, the only navigation staff need. */
export function StaffTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Staff portal" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-graphite/10 bg-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      {TABS.map((t) => {
        const active = t.href === "/staff" ? pathname === "/staff" : pathname.startsWith(t.href);
        const Icon = t.icon;
        return (
          <Link key={t.href} href={t.href} className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem]", active ? "text-copper-dark" : "text-muted-light")} aria-current={active ? "page" : undefined}>
            <Icon className="size-5" aria-hidden />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
