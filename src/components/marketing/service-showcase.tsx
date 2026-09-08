"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { services } from "@/content/services";
import { cn } from "@/lib/utils/cn";
import { Reveal } from "@/components/motion/reveal";

/**
 * Desktop: list of services on the left; the large image on the right swaps
 * as a service is hovered/focused. Mobile: editorial vertical stack with
 * full-width imagery — not six identical cards.
 */
export function ServiceShowcase() {
  const [active, setActive] = useState(0);
  const current = services[active]!;

  return (
    <section className="surface-dark relative overflow-hidden">
      <div className="container-x py-20 md:py-32">
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-copper">Services</p>
            <h2 className="font-display display-lg text-balance mt-4 max-w-2xl">Every part of a working catering facility</h2>
          </div>
          <Link href="/services" className="group inline-flex items-center gap-2 text-sm text-ivory/70 transition-colors hover:text-ivory">
            All services
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
          </Link>
        </Reveal>

        {/* Desktop */}
        <div className="mt-16 hidden grid-cols-12 gap-10 md:grid">
          <ul className="col-span-5 flex flex-col" onMouseLeave={() => {}}>
            {services.map((s, i) => (
              <li key={s.slug} className="border-t border-ivory/12 last:border-b">
                <Link
                  href={`/services/${s.slug}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className={cn(
                    "group flex items-baseline gap-6 py-6 transition-colors",
                    active === i ? "text-ivory" : "text-ivory/45 hover:text-ivory/80",
                  )}
                  aria-current={active === i ? "true" : undefined}
                >
                  <span className={cn("font-display text-lg transition-colors", active === i ? "text-copper" : "text-ivory/35")}>{s.index}</span>
                  <span className="flex-1">
                    <span className="block font-display text-3xl leading-none lg:text-4xl">{s.title}</span>
                    <span
                      className={cn(
                        "block overflow-hidden text-sm leading-relaxed text-ivory/60 transition-[max-height,opacity,margin] duration-500 ease-premium",
                        active === i ? "mt-3 max-h-24 opacity-100" : "max-h-0 opacity-0",
                      )}
                    >
                      {s.summary}
                    </span>
                  </span>
                  <ArrowUpRight className={cn("size-5 shrink-0 transition-[opacity,transform] duration-300", active === i ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0")} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>

          <div className="relative col-span-7 aspect-[4/3] overflow-hidden lg:aspect-[5/4]">
            {services.map((s, i) => (
              <Image
                key={s.slug}
                src={s.image}
                alt={i === active ? s.imageAlt : ""}
                fill
                sizes="(min-width: 768px) 55vw, 100vw"
                className={cn(
                  "object-cover transition-[opacity,transform] duration-700 ease-premium",
                  i === active ? "scale-100 opacity-100" : "scale-105 opacity-0",
                )}
                aria-hidden={i !== active}
              />
            ))}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-obsidian/80 to-transparent p-8">
              <p className="eyebrow text-copper">{current.index}</p>
              <p className="mt-2 font-display text-2xl">{current.title}</p>
            </div>
          </div>
        </div>

        {/* Mobile: editorial stack */}
        <ul className="mt-12 flex flex-col gap-12 md:hidden">
          {services.map((s, i) => (
            <li key={s.slug}>
              <Reveal delay={i * 40}>
                <Link href={`/services/${s.slug}`} className="block">
                  <div className={cn("relative aspect-[4/3] overflow-hidden", i % 2 === 1 ? "ml-8" : "mr-8")}>
                    <Image src={s.image} alt={s.imageAlt} fill sizes="100vw" className="object-cover" />
                  </div>
                  <div className="mt-5 flex items-baseline gap-4">
                    <span className="font-display text-lg text-copper">{s.index}</span>
                    <div>
                      <h3 className="font-display text-3xl leading-none">{s.title}</h3>
                      <p className="mt-3 text-[0.9375rem] leading-relaxed text-ivory/60">{s.summary}</p>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm text-ivory">
                        Explore <ArrowUpRight className="size-4 text-copper" aria-hidden />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
