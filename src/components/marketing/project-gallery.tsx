import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils/cn";

/**
 * Gallery: swipeable horizontal rail on mobile (scroll-snap), layered
 * asymmetric grid on desktop.
 */
export function ProjectGallery({ images }: { images: { src: string; alt: string }[] }) {
  if (!images.length) return null;
  return (
    <>
      {/* Mobile rail */}
      <ul className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 md:hidden">
        {images.map((img) => (
          <li key={img.src} className="relative aspect-[4/3] w-[85%] shrink-0 snap-center overflow-hidden">
            <Image src={img.src} alt={img.alt} fill sizes="85vw" className="object-cover" />
          </li>
        ))}
      </ul>
      {/* Desktop layered grid */}
      <ul className="hidden grid-cols-12 gap-6 md:grid">
        {images.map((img, i) => (
          <Reveal
            as="li"
            variant="image"
            key={img.src}
            delay={i * 80}
            className={cn(
              "relative overflow-hidden",
              i % 3 === 0 && "col-span-8 aspect-[16/10]",
              i % 3 === 1 && "col-span-4 aspect-[4/5] self-end",
              i % 3 === 2 && "col-span-6 col-start-4 aspect-[3/2] -mt-16",
            )}
          >
            <Image src={img.src} alt={img.alt} fill sizes="(min-width: 768px) 66vw, 100vw" className="object-cover" />
          </Reveal>
        ))}
      </ul>
    </>
  );
}
