import { stats } from "@/content/homepage";
import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";

/**
 * Animated statistics. Renders nothing until real values exist in
 * content/homepage.ts — no invented figures.
 */
export function StatStrip() {
  const real = stats.filter((s): s is typeof s & { value: number } => typeof s.value === "number");
  if (real.length === 0) return null;

  return (
    <section className="surface-stone">
      <div className="container-x py-16 md:py-20">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4 lg:grid-cols-5">
          {real.map((s, i) => (
            <Reveal key={s.label} delay={i * 70} className="border-l border-graphite/15 pl-5">
              <dd className="font-display text-5xl text-graphite md:text-6xl">
                <CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} />
              </dd>
              <dt className="mt-2 text-sm text-muted-light">{s.label}</dt>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
