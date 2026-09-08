import Image from "next/image";
import { hero } from "@/content/homepage";
import { credibilityLine } from "@/content/site";
import { LinkButton } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { Parallax } from "@/components/motion/parallax";

/**
 * Homepage hero. Media slot accepts image or video via content/homepage.ts;
 * no redesign needed to swap placeholder assets for real footage.
 */
export function Hero() {
  const { media } = hero;
  return (
    <section className="surface-dark relative isolate min-h-[100svh] overflow-hidden">
      {/* Media */}
      <div className="absolute inset-0 -z-10">
        <Parallax strength={6} className="h-[112%] -mt-[6%]">
          {media.type === "video" ? (
            <video
              className="size-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              poster={media.poster}
              aria-hidden
            >
              <source src={media.src} />
            </video>
          ) : (
            <Image
              src={media.src}
              alt={media.alt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          )}
        </Parallax>
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/55 to-obsidian/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/70 via-transparent to-transparent" />
      </div>

      <div className="container-x relative flex min-h-[100svh] flex-col justify-end pb-12 pt-32 md:pb-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-9 lg:col-span-8">
            <Reveal>
              <p className="eyebrow text-copper">{hero.eyebrow}</p>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="font-display display-xl text-balance mt-5 max-w-[14ch]">{hero.headline}</h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-8 max-w-xl text-pretty text-lg leading-relaxed text-ivory/75 md:text-xl">{hero.supporting}</p>
            </Reveal>
            <Reveal delay={240} className="mt-10 flex flex-wrap gap-3">
              <LinkButton href={hero.primaryCta.href} variant="copper" size="lg" arrow>
                {hero.primaryCta.label}
              </LinkButton>
              <LinkButton href={hero.secondaryCta.href} variant="outlineLight" size="lg">
                {hero.secondaryCta.label}
              </LinkButton>
            </Reveal>
          </div>

          <Reveal delay={320} className="hidden md:col-span-3 md:block lg:col-span-4">
            <p className="eyebrow text-ivory/45">Established {new Date().getFullYear() - 2023 >= 0 ? "2023" : ""}</p>
            <p className="mt-3 max-w-[22ch] text-sm leading-relaxed text-ivory/60">
              Integrated catering infrastructure and operations for sites, workplaces and organisations across the UK.
            </p>
          </Reveal>
        </div>

        {/* Credibility line */}
        <Reveal delay={400} className="mt-14 border-t border-ivory/12 pt-5">
          <ul className="no-scrollbar -mx-5 flex gap-8 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-5 md:gap-4 md:px-0">
            {credibilityLine.map((item, i) => (
              <li key={item} className="flex shrink-0 items-baseline gap-3 text-sm text-ivory/70">
                <span className="font-display text-base text-copper">0{i + 1}</span>
                <span className="whitespace-nowrap">{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
