import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Reveal } from "@/components/motion/reveal";

type Props = {
  eyebrow?: string;
  heading: string;
  lead?: string;
  body?: string[];
  points?: { label: string; detail: string }[];
  image: { src: string; alt: string };
  reverse?: boolean;
  tone?: "light" | "dark" | "stone";
  children?: React.ReactNode;
};

/**
 * Asymmetric editorial split: tall image on one side offset vertically,
 * copy column on the other. Image overlaps the section boundary on desktop.
 */
export function EditorialSplit({ eyebrow, heading, lead, body, points, image, reverse, tone = "light", children }: Props) {
  const dark = tone === "dark";
  return (
    <section className={cn("relative overflow-hidden", tone === "light" && "surface-light", tone === "dark" && "surface-dark", tone === "stone" && "surface-stone")}>
      <div className="container-x grid grid-cols-1 gap-12 py-20 md:grid-cols-12 md:gap-8 md:py-32 lg:py-40">
        <Reveal
          variant="image"
          className={cn("relative aspect-[4/5] md:col-span-5 md:aspect-auto md:min-h-[36rem]", reverse ? "md:order-2 md:col-start-8" : "md:col-start-1")}
        >
          <Image src={image.src} alt={image.alt} fill sizes="(min-width: 768px) 42vw, 100vw" className="object-cover" />
          <span aria-hidden className={cn("absolute -bottom-6 hidden h-24 w-px md:block", dark ? "bg-copper" : "bg-copper-dark", reverse ? "left-0" : "right-0")} />
        </Reveal>

        <div className={cn("flex flex-col justify-center md:col-span-6", reverse ? "md:order-1 md:col-start-1" : "md:col-start-7")}>
          <Reveal>
            {eyebrow ? <p className={cn("eyebrow", dark ? "text-copper" : "text-copper-dark")}>{eyebrow}</p> : null}
            <h2 className="font-display display-lg text-balance mt-4">{heading}</h2>
          </Reveal>
          {lead ? (
            <Reveal delay={80}>
              <p className={cn("mt-8 font-display text-2xl leading-snug text-pretty md:text-3xl", dark ? "text-ivory/85" : "text-graphite")}>{lead}</p>
            </Reveal>
          ) : null}
          {body?.map((p, i) => (
            <Reveal key={i} delay={120 + i * 60}>
              <p className={cn("mt-6 max-w-prose text-pretty text-base leading-relaxed md:text-lg", dark ? "text-ivory/65" : "text-muted-light")}>{p}</p>
            </Reveal>
          ))}
          {points?.length ? (
            <Reveal delay={260}>
              <dl className={cn("mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t pt-8", dark ? "border-ivory/12" : "border-graphite/12")}>
                {points.map((pt) => (
                  <div key={pt.label}>
                    <dt className="font-display text-2xl">{pt.label}</dt>
                    <dd className={cn("mt-1 text-sm leading-snug", dark ? "text-ivory/60" : "text-muted-light")}>{pt.detail}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          ) : null}
          {children}
        </div>
      </div>
    </section>
  );
}
