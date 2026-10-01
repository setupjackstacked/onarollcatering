import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils/cn";
import type { GalleryImage } from "@/content/gallery";

/**
 * A wall of the company's own work.
 *
 * A plain masonry-ish grid rather than the layered, overlapping treatment used
 * on project pages: these are phone photographs of real service, and clever
 * cropping makes them look like they are hiding something. Shown square and
 * level, they read as evidence.
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

        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-5">
          {images.map((image, i) => (
            <Reveal
              as="li"
              variant="image"
              key={image.src}
              delay={Math.min(i, 11) * 60}
              className={cn(
                "relative overflow-hidden bg-graphite/5",
                // Every fifth tile runs tall, so the grid has a rhythm without
                // any single photograph being cropped beyond recognition.
                i % 5 === 0 ? "aspect-[4/5] md:row-span-2 md:aspect-[4/5]" : "aspect-square",
              )}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover transition-transform duration-700 hover:scale-[1.04]"
              />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
