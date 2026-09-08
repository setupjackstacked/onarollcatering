"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

type RevealProps = {
  as?: "div" | "li" | "section" | "article" | "figure" | "span" | "p" | "header";
  delay?: number;
  className?: string;
  children: React.ReactNode;
  /** "fade" = translate+fade (default), "image" = clip wipe */
  variant?: "fade" | "image";
  once?: boolean;
};

/**
 * Scroll-triggered reveal. Pure CSS transitions driven by IntersectionObserver;
 * no animation library. Respects prefers-reduced-motion via globals.css.
 */
export function Reveal({
  as,
  delay = 0,
  className,
  children,
  variant = "fade",
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const attr = variant === "image" ? "data-image-reveal" : "data-reveal";
    if (typeof IntersectionObserver === "undefined") {
      el.setAttribute(attr, "in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.setAttribute(attr, "in");
            if (once) io.unobserve(el);
          } else if (!once) {
            el.setAttribute(attr, "");
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [variant, once]);

  const Tag = (as ?? "div") as React.ElementType;
  const attrs = variant === "image" ? { "data-image-reveal": "" } : { "data-reveal": "" };

  return (
    <Tag
      ref={ref}
      className={cn(className)}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
      {...attrs}
    >
      {children}
    </Tag>
  );
}
