"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navigation } from "@/content/site";
import { services } from "@/content/services";
import { cn } from "@/lib/utils/cn";
import { LinkButton } from "@/components/ui/button";
import { LogoLink } from "./logo";
import { MobileNavigation } from "./mobile-navigation";

/**
 * Fixed header. Transparent over the dark hero, gains an obsidian surface on
 * scroll. Services has a mega-menu on desktop.
 */
export function MarketingHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Close the mega-menu whenever the route changes.
  useEffect(() => {
    const id = requestAnimationFrame(() => setServicesOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 text-ivory transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-premium",
        scrolled || servicesOpen
          ? "bg-obsidian/92 backdrop-blur-md shadow-[0_1px_0_0_rgba(243,239,232,0.08)]"
          : "bg-transparent",
      )}
      onMouseLeave={() => setServicesOpen(false)}
    >
      <div className="container-x flex h-18 items-center justify-between gap-6 md:h-22">
        <LogoLink priority variant="horizontal" className="h-9 md:h-11" />

        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {navigation.primary.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const isServices = item.href === "/services";
            return (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => isServices && setServicesOpen(true)}
              >
                <Link
                  href={item.href}
                  aria-haspopup={isServices ? "true" : undefined}
                  aria-expanded={isServices ? servicesOpen : undefined}
                  onFocus={() => isServices && setServicesOpen(true)}
                  className={cn(
                    "relative py-2 text-[0.9375rem] tracking-tight text-ivory/80 transition-colors hover:text-ivory",
                    "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-copper after:transition-transform after:duration-300 after:ease-premium hover:after:scale-x-100",
                    active && "text-ivory after:scale-x-100",
                  )}
                >
                  {item.label}
                </Link>
              </div>
            );
          })}
          <LinkButton href={navigation.cta.href} variant="copper" size="sm" arrow>
            {navigation.cta.label}
          </LinkButton>
        </nav>

        <MobileNavigation />
      </div>

      {/* Services mega-menu */}
      <div
        className={cn(
          "hidden lg:block absolute inset-x-0 top-full origin-top border-t border-ivory/10 bg-obsidian/96 backdrop-blur-md transition-[opacity,transform] duration-300 ease-premium",
          servicesOpen ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-2",
        )}
        aria-hidden={!servicesOpen}
      >
        <div className="container-x grid grid-cols-12 gap-10 py-10">
          <div className="col-span-4">
            <p className="eyebrow text-copper">Services</p>
            <p className="mt-4 font-display text-3xl text-ivory">
              Design, build, staff and operate — under one contract.
            </p>
            <Link href="/services" className="mt-6 inline-block text-sm text-ivory/70 underline-offset-4 hover:text-ivory hover:underline">
              All services
            </Link>
          </div>
          <ul className="col-span-8 grid grid-cols-2 gap-x-10 gap-y-2">
            {services.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/services/${s.slug}`}
                  className="group flex gap-4 rounded-md px-3 py-3 transition-colors hover:bg-ivory/5"
                  tabIndex={servicesOpen ? 0 : -1}
                >
                  <span className="font-display text-lg text-copper">{s.index}</span>
                  <span>
                    <span className="block text-[0.9375rem] font-medium text-ivory">{s.title}</span>
                    <span className="mt-1 block text-sm leading-snug text-ivory/60 group-hover:text-ivory/80">{s.summary}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}
