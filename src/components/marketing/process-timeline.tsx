import { process } from "@/content/homepage";
import { Reveal } from "@/components/motion/reveal";

/**
 * Four-step process. Desktop: horizontal rule with numbered columns.
 * Mobile: vertical rail with large numerals — thumb-scrollable, no cards.
 */
export function ProcessTimeline() {
  return (
    <section className="surface-light relative">
      <div className="container-x py-20 md:py-32">
        <Reveal className="max-w-2xl">
          <p className="eyebrow text-copper-dark">{process.eyebrow}</p>
          <h2 className="font-display display-lg text-balance mt-4">{process.heading}</h2>
        </Reveal>

        <ol className="relative mt-16 grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-8">
          <span aria-hidden className="absolute left-4 top-0 h-full w-px bg-graphite/12 md:left-0 md:top-6 md:h-px md:w-full" />
          {process.steps.map((step, i) => (
            <Reveal as="li" key={step.number} delay={i * 90} className="relative pl-12 md:pl-0 md:pt-12">
              <span
                aria-hidden
                className="absolute left-4 top-1 size-2 -translate-x-1/2 rounded-full bg-copper ring-4 ring-ivory md:left-0 md:top-6 md:-translate-y-1/2 md:translate-x-0"
              />
              <span className="font-display text-5xl text-copper-dark md:text-6xl">{step.number}</span>
              <h3 className="mt-3 font-display text-3xl">{step.title}</h3>
              <p className="mt-3 max-w-xs text-pretty text-[0.9375rem] leading-relaxed text-muted-light">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
