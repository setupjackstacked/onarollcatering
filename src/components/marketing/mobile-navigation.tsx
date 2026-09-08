"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ArrowUpRight, Phone } from "lucide-react";
import { navigation, site } from "@/content/site";
import { services } from "@/content/services";
import { cn } from "@/lib/utils/cn";

/**
 * Full-height off-canvas navigation for < lg. Large touch targets, numbered
 * services, contact at the bottom, CTA fixed in the thumb zone.
 */
export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change.
  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-nav"
        className="-mr-2 inline-flex size-12 items-center justify-center rounded-full text-ivory transition-colors hover:bg-ivory/10"
      >
        <Menu className="size-6" />
      </button>

      <div
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={cn(
          "fixed inset-0 z-[60] flex flex-col bg-obsidian text-ivory transition-[opacity,visibility] duration-400 ease-premium",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <div className="grain relative flex h-18 items-center justify-between px-5">
          <span className="eyebrow text-copper">Menu</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="-mr-2 inline-flex size-12 items-center justify-center rounded-full transition-colors hover:bg-ivory/10"
          >
            <X className="size-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 pb-40">
          <ul className="divide-y divide-ivory/10 border-y border-ivory/10">
            {navigation.primary.map((item, i) => (
              <li
                key={item.href}
                className={cn("transition-[opacity,transform] duration-500 ease-premium", open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0")}
                style={{ transitionDelay: open ? `${80 + i * 50}ms` : "0ms" }}
              >
                <Link
                  href={item.href}
                  className="flex items-center justify-between py-5 font-display text-4xl leading-none"
                >
                  {item.label}
                  <ArrowUpRight className="size-5 text-copper" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>

          <p className="eyebrow mt-10 text-ivory/50">Services</p>
          <ul className="mt-4 grid grid-cols-1 gap-1 xs:grid-cols-2">
            {services.map((s, i) => (
              <li
                key={s.slug}
                className={cn("transition-[opacity,transform] duration-500 ease-premium", open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0")}
                style={{ transitionDelay: open ? `${300 + i * 40}ms` : "0ms" }}
              >
                <Link href={`/services/${s.slug}`} className="flex min-h-12 items-center gap-3 rounded-md py-2 pr-2 text-[0.9375rem] text-ivory/85">
                  <span className="font-display text-base text-copper">{s.index}</span>
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-10 border-t border-ivory/10 pt-6 text-sm text-ivory/60">
            <a href={site.contact.phone.href} className="flex min-h-12 items-center gap-3 text-ivory/85">
              <Phone className="size-4 text-copper" aria-hidden /> {site.contact.phone.display}
            </a>
            <a href={`mailto:${site.contact.email.display}`} className="flex min-h-12 items-center text-ivory/85">
              {site.contact.email.display}
            </a>
          </div>
        </nav>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-obsidian via-obsidian/95 to-transparent p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <Link
            href={navigation.cta.href}
            className="pointer-events-auto flex h-14 w-full items-center justify-center gap-2 rounded-full bg-copper text-base font-medium text-ivory active:scale-[0.98]"
          >
            {navigation.cta.label} <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
