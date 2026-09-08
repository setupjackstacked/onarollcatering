import type { Faq } from "@/content/faqs";
import { SectionIntro } from "./section-intro";
import { Reveal } from "@/components/motion/reveal";

/** Native <details> accordion — accessible, no JS, works everywhere. */
export function Faqs({ items, heading = "Common questions" }: { items: Faq[]; heading?: string }) {
  return (
    <section className="surface-stone">
      <div className="container-x grid grid-cols-1 gap-12 py-20 md:grid-cols-12 md:py-28">
        <div className="md:col-span-4">
          <SectionIntro eyebrow="FAQ" heading={heading} size="md" />
        </div>
        <Reveal className="md:col-span-8">
          <dl className="divide-y divide-graphite/12 border-y border-graphite/12">
            {items.map((f) => (
              <details key={f.question} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                  <dt>{f.question}</dt>
                  <span aria-hidden className="relative size-5 shrink-0">
                    <span className="absolute inset-x-0 top-1/2 h-px bg-graphite" />
                    <span className="absolute inset-y-0 left-1/2 w-px bg-graphite transition-transform duration-300 group-open:rotate-90" />
                  </span>
                </summary>
                <dd className="pb-6 max-w-prose text-pretty text-base leading-relaxed text-muted-light">{f.answer}</dd>
              </details>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
