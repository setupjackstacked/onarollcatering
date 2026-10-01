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
 *
 * Built to fail towards visible. The hidden state only exists when the root
 * layout has confirmed an observer is available (the .motion-ready class), and
 * on top of that this runs an immediate in-view check and a safety timeout. An
 * animation that does not play is a blemish; content that never appears is a
 * broken page, and the page was doing the second.
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
    const show = () => el.setAttribute(attr, "in");

    if (typeof IntersectionObserver === "undefined") {
      show();
      return;
    }

    // Anything already on screen when this mounts is shown at once. Waiting for
    // the observer's first callback leaves above-the-fold content blank for a
    // frame, and leaves it blank forever if that callback never arrives.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) show();

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show();
            if (once) io.unobserve(el);
          } else if (!once) {
            el.setAttribute(attr, "");
          }
        }
      },
      // threshold 0 so a block taller than the viewport still counts as visible
      // the moment any edge of it appears; 0.12 of a very tall image never does.
      { rootMargin: "0px 0px -5% 0px", threshold: 0 },
    );
    io.observe(el);

    // Last resort. If the observer is wrong about this element for any reason,
    // the content appears anyway — a missed animation is a far smaller failure
    // than a paragraph nobody can read.
    const safety = window.setTimeout(() => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 1.5 && r.bottom > -window.innerHeight * 0.5) show();
    }, 2500);

    return () => {
      io.disconnect();
      window.clearTimeout(safety);
    };
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
