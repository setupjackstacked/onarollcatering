import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Reveal } from "@/components/motion/reveal";

type Props = {
  eyebrow?: string;
  heading: string;
  lead?: string;
  image?: { src: string; alt: string };
  meta?: { label: string; value: string }[];
  children?: React.ReactNode;
  compact?: boolean;
};

/** Interior page hero: dark, editorial, optional offset image. */
export function PageHero({ eyebrow, heading, lead, image, meta, children, compact }: Props) {
  return (
    <section className="surface-dark grain relative overflow-hidden">
      <div className={cn("container-x relative grid grid-cols-1 gap-10 pb-16 md:grid-cols-12 md:pb-24", compact ? "pt-32 md:pt-40" : "pt-36 md:pt-48")}>
        <Reveal className={cn(image ? "md:col-span-7" : "md:col-span-9")}>
          {eyebrow ? <p className="eyebrow text-copper">{eyebrow}</p> : null}
          <h1 className="font-display display-xl text-balance mt-5">{heading}</h1>
          {lead ? <p className="mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-ivory/70 md:text-xl">{lead}</p> : null}
          {meta?.length ? (
            <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-ivory/10 pt-6 sm:grid-cols-4">
              {meta.map((m) => (
                <div key={m.label}>
                  <dt className="eyebrow text-ivory/45">{m.label}</dt>
                  <dd className="mt-2 text-[0.9375rem] text-ivory/90">{m.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {children}
        </Reveal>
        {image ? (
          <Reveal variant="image" delay={150} className="relative aspect-[4/5] md:col-span-5 md:aspect-auto md:min-h-[28rem]">
            <Image src={image.src} alt={image.alt} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" priority />
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
