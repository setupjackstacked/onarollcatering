import { credibilityLine } from "@/content/site";

/**
 * Credibility strip. Client logos must NOT be shown until approved by the
 * business owner (spec §2). Until then this renders capability terms as a
 * slow marquee; pass `logos` later to switch to approved client marks.
 */
export function LogoStrip({ logos }: { logos?: { src: string; alt: string }[] }) {
  const items = logos?.length ? logos : null;
  const track = items ? items : [...credibilityLine, ...credibilityLine];

  return (
    <div className="overflow-hidden border-y border-graphite/10 surface-light py-5">
      <ul className="flex w-max animate-marquee gap-16 whitespace-nowrap px-8 text-sm uppercase tracking-[0.2em] text-muted-light">
        {[...track, ...track].map((item, i) =>
          typeof item === "string" ? (
            <li key={i} className="flex items-center gap-16">
              <span>{item}</span>
              <span aria-hidden className="size-1 rounded-full bg-copper" />
            </li>
          ) : (
            <li key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.src} alt={item.alt} className="h-8 w-auto opacity-70" />
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
