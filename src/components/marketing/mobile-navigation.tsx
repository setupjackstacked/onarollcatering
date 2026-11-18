"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Menu, X, ArrowUpRight, Phone } from "lucide-react";
import { navigation, site } from "@/content/site";
import { pillars, servicesInPillar } from "@/content/services";
import { cn } from "@/lib/utils/cn";

/** Never changes, so the store never re-notifies — this is purely an "are we on
 *  the client yet" signal without a setState-in-effect round trip. */
const subscribeNever = () => () => {};

/**
 * Full-height off-canvas navigation for < lg. Large touch targets, the three
 * core services, contact at the bottom, CTA fixed in the thumb zone.
 *
 * The panel is rendered into document.body rather than where it sits in the
 * tree. It has to be: the header applies backdrop-blur once the page is
 * scrolled, and a backdrop-filter makes an element a containing block for every
 * fixed-position descendant. Left inside the header, `fixed inset-0` resolves
 * to the header's own 72px strip — the dark background paints only that sliver
 * while the menu text spills down the page over whatever is behind it. It works
 * at the top of the page, where there is no blur, and breaks the moment you
 * scroll, which is the worst kind of bug to find by hand.
 *
 * A portal puts the panel beyond the reach of any ancestor filter or transform,
 * including ones nobody has added yet.
 */
export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Portals need a DOM: false while rendering on the server, true once hydrated.
  // useSyncExternalStore gives that without a setState inside an effect, which
  // the React Compiler rules rightly reject as a cascading render.
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

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

  const close = () => setOpen(false);

  const panel = (
    <div
      id="mobile-nav"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation"
      className={cn(
        "fixed inset-0 z-[60] flex flex-col bg-obsidian text-ivory transition-[opacity,visibility] duration-500 ease-premium lg:hidden",
        open ? "visible opacity-100" : "invisible opacity-0",
      )}
    >
      <div className="grain relative flex h-18 items-center justify-between px-5">
        <span className="eyebrow text-copper">Menu</span>
        <button
          type="button"
          onClick={close}
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
              className={cn(
                "transition-[opacity,transform] duration-500 ease-premium",
                open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
              )}
              style={{ transitionDelay: open ? `${80 + i * 50}ms` : "0ms" }}
            >
              <Link
                href={item.href}
                onClick={close}
                className="flex items-center justify-between py-5 font-display text-4xl leading-none"
              >
                {item.label}
                <ArrowUpRight className="size-5 text-copper" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>

        <p className="eyebrow mt-10 text-ivory/50">Services</p>
        <ul className="mt-4 flex flex-col gap-5">
          {pillars.map((p, i) => (
            <li
              key={p.slug}
              className={cn(
                "transition-[opacity,transform] duration-500 ease-premium",
                open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
              )}
              style={{ transitionDelay: open ? `${300 + i * 60}ms` : "0ms" }}
            >
              <Link href="/services" onClick={close} className="flex min-h-12 items-center gap-3 text-[1.0625rem] text-ivory">
                <span className="font-display text-base text-copper">{p.index}</span>
                {p.title}
              </Link>
              <ul className="ml-7 border-l border-ivory/10 pl-4">
                {servicesInPillar(p).map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/services/${s.slug}`}
                      onClick={close}
                      className="flex min-h-11 items-center text-sm text-ivory/60"
                    >
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
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
          onClick={close}
          className="pointer-events-auto flex h-14 w-full items-center justify-center gap-2 rounded-full bg-copper text-base font-medium text-ivory active:scale-[0.98]"
        >
          {navigation.cta.label} <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );

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

      {mounted ? createPortal(panel, document.body) : null}
    </div>
  );
}
