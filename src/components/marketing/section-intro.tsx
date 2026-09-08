import { cn } from "@/lib/utils/cn";
import { Reveal } from "@/components/motion/reveal";

type Props = {
  eyebrow?: string;
  heading: string;
  lead?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
  size?: "lg" | "md";
  className?: string;
  children?: React.ReactNode;
};

/** Editorial section opener: eyebrow, display heading, optional lead. */
export function SectionIntro({ eyebrow, heading, lead, align = "left", tone = "light", size = "lg", className, children }: Props) {
  const dark = tone === "dark";
  return (
    <Reveal className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <p className={cn("eyebrow", dark ? "text-copper" : "text-copper-dark")}>{eyebrow}</p> : null}
      <h2 className={cn("font-display text-balance mt-4", size === "lg" ? "display-lg" : "display-md")}>{heading}</h2>
      {lead ? (
        <p className={cn("mt-6 text-pretty text-lg leading-relaxed md:text-xl", dark ? "text-ivory/70" : "text-muted-light")}>
          {lead}
        </p>
      ) : null}
      {children}
    </Reveal>
  );
}
