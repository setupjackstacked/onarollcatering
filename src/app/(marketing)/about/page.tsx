import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/marketing/page-hero";
import { QuoteCTA } from "@/components/marketing/quote-cta";
import { SectionIntro } from "@/components/marketing/section-intro";
import { Reveal } from "@/components/motion/reveal";
import { about } from "@/content/about";

export const metadata: Metadata = {
  title: "About",
  description: "On A Roll Catering — integrated commercial catering and kitchen solutions, established 2023.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow={about.eyebrow} heading={about.heading} lead={about.story[0]} image={{ src: about.image, alt: about.imageAlt }} />

      {/* Story + approach */}
      <section className="surface-light">
        <div className="container-x grid grid-cols-1 gap-12 py-20 md:grid-cols-12 md:py-32">
          <Reveal className="md:col-span-5">
            <p className="eyebrow text-copper-dark">Story</p>
            {about.story.slice(1).map((p) => (
              <p key={p} className="mt-5 max-w-prose text-pretty text-base leading-relaxed text-muted-light md:text-lg">
                {p}
              </p>
            ))}
          </Reveal>
          <Reveal delay={100} className="md:col-span-6 md:col-start-7">
            <p className="eyebrow text-copper-dark">{about.approach.heading}</p>
            <p className="mt-5 font-display text-2xl leading-snug text-pretty md:text-3xl">{about.approach.body}</p>
          </Reveal>
        </div>
      </section>

      {/* Capabilities — dark, large numbered list */}
      <section className="surface-dark grain relative">
        <div className="container-x grid grid-cols-1 gap-12 py-20 md:grid-cols-12 md:py-32">
          <div className="md:col-span-4">
            <SectionIntro tone="dark" eyebrow="Capabilities" heading="What we deliver" size="md" />
          </div>
          <ol className="md:col-span-8">
            {about.capabilities.map((c, i) => (
              <Reveal as="li" key={c} delay={i * 50} className="flex items-baseline gap-6 border-t border-ivory/12 py-5 last:border-b">
                <span className="font-display text-lg text-copper">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-2xl md:text-3xl">{c}</span>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Values — asymmetric two-column, no cards */}
      <section className="surface-stone">
        <div className="container-x py-20 md:py-32">
          <SectionIntro eyebrow="Values" heading="How we work" size="md" />
          <dl className="mt-14 grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {about.values.map((v, i) => (
              <Reveal key={v.title} delay={i * 70} className="border-t border-graphite/15 pt-5">
                <dt className="font-display text-3xl">{v.title}</dt>
                <dd className="mt-3 text-pretty text-[0.9375rem] leading-relaxed text-muted-light">{v.body}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* Experience + coverage */}
      <section className="surface-light">
        <div className="container-x grid grid-cols-1 gap-12 py-20 md:grid-cols-12 md:py-32">
          <Reveal className="md:col-span-5">
            <p className="eyebrow text-copper-dark">{about.experience.heading}</p>
            <p className="mt-5 max-w-prose text-pretty text-base leading-relaxed text-muted-light md:text-lg">{about.experience.body}</p>
            <p className="eyebrow mt-12 text-copper-dark">{about.coverage.heading}</p>
            <p className="mt-5 max-w-prose text-pretty text-base leading-relaxed text-muted-light md:text-lg">{about.coverage.body}</p>
          </Reveal>
          <Reveal variant="image" delay={120} className="relative aspect-[4/3] md:col-span-6 md:col-start-7">
            <Image src={about.image} alt={about.imageAlt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </Reveal>
        </div>
      </section>

      {about.leadership.length ? (
        <section className="surface-stone">
          <div className="container-x py-20 md:py-32">
            <SectionIntro eyebrow="Leadership" heading="The team" size="md" />
            <ul className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {about.leadership.map((l) => (
                <li key={l.name}>
                  {l.image ? (
                    <div className="relative aspect-[4/5]">
                      <Image src={l.image} alt={l.name} fill className="object-cover" />
                    </div>
                  ) : null}
                  <p className="mt-4 font-display text-2xl">{l.name}</p>
                  <p className="text-sm text-muted-light">{l.role}</p>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-light">{l.bio}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <QuoteCTA heading="Talk to us about your next facility" body="Whether it's a site kitchen for next month or a long-term contract, start with a conversation." cta={{ label: "Discuss Your Project", href: "/quote" }} secondary={{ label: "Contact", href: "/contact" }} />
    </>
  );
}
