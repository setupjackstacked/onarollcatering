import { LinkButton } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils/cn";

type Props = {
  heading: string;
  body?: string;
  cta?: { label: string; href: string };
  secondary?: { label: string; href: string };
  tone?: "dark" | "copper" | "light";
  className?: string;
};

/** Strong commercial close. Full-bleed, no card. */
export function QuoteCTA({
  heading,
  body,
  cta = { label: "Start a Project", href: "/quote" },
  secondary,
  tone = "dark",
  className,
}: Props) {
  const dark = tone !== "light";
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        tone === "dark" && "surface-dark grain",
        tone === "copper" && "bg-copper text-ivory",
        tone === "light" && "surface-stone",
        className,
      )}
    >
      <div className="container-x relative grid grid-cols-1 items-end gap-10 py-24 md:grid-cols-12 md:py-36">
        <Reveal className="md:col-span-8">
          <h2 className="font-display display-lg text-balance">{heading}</h2>
          {body ? (
            <p className={cn("mt-6 max-w-xl text-pretty text-lg md:text-xl", dark ? "text-ivory/70" : "text-muted-light")}>{body}</p>
          ) : null}
        </Reveal>
        <Reveal delay={120} className="flex flex-wrap gap-3 md:col-span-4 md:justify-end">
          <LinkButton href={cta.href} variant={tone === "copper" ? "ivory" : "copper"} size="lg" arrow>
            {cta.label}
          </LinkButton>
          {secondary ? (
            <LinkButton href={secondary.href} variant={dark ? "outlineLight" : "outlineDark"} size="lg">
              {secondary.label}
            </LinkButton>
          ) : null}
        </Reveal>
      </div>
      {tone === "dark" ? (
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-copper/15 blur-3xl" />
      ) : null}
    </section>
  );
}
