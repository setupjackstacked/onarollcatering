import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { QuoteCTA } from "@/components/marketing/quote-cta";
import { Reveal } from "@/components/motion/reveal";
import { Faqs } from "@/components/marketing/faqs";
import { pillars, servicesInPillar } from "@/content/services";
import { faqs } from "@/content/faqs";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Commercial kitchens, contract catering and project delivery — specified, built, staffed and operated as one accountable contract.",
  alternates: { canonical: "/services" },
};

/**
 * Three sections, not six cards.
 *
 * The detailed service pages still exist and still carry the substance; they
 * are linked beneath whichever pillar they belong to rather than competing
 * with it. A visitor chooses from three things and then goes deeper, instead
 * of weighing six overlapping options at the door.
 */
export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        heading="Design, build, staff and operate"
        lead="Three core services that combine into a complete catering facility — specified, delivered and run by one accountable team."
        compact
      />

      <section className="surface-light">
        <div className="container-x py-16 md:py-24">
          <ul className="flex flex-col">
            {pillars.map((p, i) => {
              const detail = servicesInPillar(p);
              return (
                <Reveal as="li" key={p.slug} className="border-t border-graphite/12 last:border-b">
                  <div className="grid grid-cols-1 gap-6 py-10 md:grid-cols-12 md:items-center md:gap-10 md:py-12">
                    <div className={cn("relative aspect-[4/3] overflow-hidden md:col-span-4 md:aspect-[5/4]", i % 2 === 1 && "md:order-3")}>
                      <Image
                        src={p.image}
                        alt={p.imageAlt}
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="object-cover"
                      />
                    </div>

                    <div className="md:col-span-1 md:order-1">
                      <span className="font-display text-3xl text-copper-dark">{p.index}</span>
                    </div>

                    <div className="md:col-span-7 md:order-2">
                      <h2 className="font-display display-md text-balance">{p.title}</h2>
                      <p className="mt-4 max-w-prose text-pretty text-base leading-relaxed text-muted-light md:text-lg">
                        {p.summary}
                      </p>

                      <ul className="mt-5 flex flex-wrap gap-2">
                        {p.covers.map((c) => (
                          <li key={c} className="rounded-full border border-graphite/15 px-3 py-1 text-xs text-muted-light">
                            {c}
                          </li>
                        ))}
                      </ul>

                      {detail.length ? (
                        <ul className="mt-6 flex flex-col gap-1 border-t border-graphite/10 pt-5">
                          {detail.map((s) => (
                            <li key={s.slug}>
                              <Link
                                href={`/services/${s.slug}`}
                                className="group inline-flex min-h-11 items-center gap-2 text-sm font-medium"
                              >
                                {s.title}
                                <ArrowUpRight
                                  className="size-4 text-copper-dark transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                  aria-hidden
                                />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </section>

      <Faqs items={faqs} />
      <QuoteCTA
        heading="Not sure which service you need?"
        body="Describe the site and the outcome. We'll scope the right combination."
        cta={{ label: "Discuss Your Project", href: "/quote" }}
      />
    </>
  );
}
