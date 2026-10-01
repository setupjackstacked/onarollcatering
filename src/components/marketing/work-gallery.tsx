import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils/cn";
import type { GalleryImage } from "@/content/gallery";

/**
 * A wall of the company's own work.
 *
 * Every tile is the same square. Mixed tile heights read as a design idea when
 * the photographs are art-directed and as a mistake when they are not — and
 * these are phone photographs, shot in portrait, landscape and square. A strict
 * grid also survives the jump to a phone, where a two-column run of ragged
 * heights turns into a staircase.
 *
 * The cost is cropping: a square centre-crop of a tall photograph loses its top
 * and bottom. For plated food, counters and kitchen lines the subject sits in
 * the middle, so the trade is worth it.
 *
 * Every tile is its own reveal, staggered down the grid, and the stagger is
 * capped — by the twelfth tile a visitor is waiting, not being delighted.
 */
export function WorkGallery({
  images,
  eyebrow,
  heading,
  lead,
  tone = "stone",
}: {
  images: GalleryImage[];
  eyebrow?: string;
  heading?: string;
  lead?: string;
  tone?: "light" | "stone" | "dark";
}) {
  if (!images.length) return null;
  const dark = tone === "dark";

  return (
    <section
      className={cn(
        tone === "light" && "surface-light",
        tone === "stone" && "surface-stone",
        tone === "dark" && "surface-dark",
      )}
    >
      <div className="container-x py-20 md:py-28">
        {heading ? (
          <Reveal className="mb-12 max-w-2xl md:mb-16">
            {eyebrow ? <p className={cn("eyebrow", dark ? "text-copper" : "text-copper-dark")}>{eyebrow}</p> : null}
            <h2 className="font-display display-lg text-balance mt-4">{heading}</h2>
            {lead ? (
              <p className={cn("mt-6 max-w-prose text-pretty text-base leading-relaxed md:text-lg", dark ? "text-ivory/65" : "text-muted-light")}>
                {lead}
              </p>
            ) : null}
          </Reveal>
        ) : null}

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {images.map((image, i) => (
            <Reveal
              as="li"
              variant="image"
              key={image.src}
              delay={Math.min(i, 11) * 60}
              className="relative aspect-square overflow-hidden bg-graphite/5"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-700 hover:scale-[1.04]"
              />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
