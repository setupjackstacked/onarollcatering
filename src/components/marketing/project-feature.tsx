import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/content/projects";
import { cn } from "@/lib/utils/cn";
import { Reveal } from "@/components/motion/reveal";

/**
 * Large-format project feature. Alternates image side. Image scales on hover.
 * Placeholder projects carry a visible "Sample" tag.
 */
export function ProjectFeature({ project, index, reverse }: { project: Project; index: number; reverse?: boolean }) {
  return (
    <article className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-10">
      <Reveal
        variant="image"
        className={cn("group relative aspect-[16/11] overflow-hidden md:col-span-8 md:aspect-[16/10]", reverse ? "md:order-2 md:col-start-5" : "md:col-start-1")}
      >
        <Link href={`/projects/${project.slug}`} className="block size-full" aria-label={project.title}>
          <Image
            src={project.cover}
            alt={project.coverAlt}
            fill
            sizes="(min-width: 768px) 66vw, 100vw"
            className="object-cover transition-transform duration-[1200ms] ease-premium group-hover:scale-[1.04]"
          />
        </Link>
        {project.placeholder ? (
          <span className="absolute left-4 top-4 rounded-full bg-obsidian/70 px-3 py-1 text-[0.6875rem] uppercase tracking-[0.18em] text-ivory backdrop-blur">
            Sample
          </span>
        ) : null}
      </Reveal>

      <Reveal delay={120} className={cn("flex flex-col justify-end md:col-span-4", reverse ? "md:order-1 md:col-start-1" : "md:col-start-9")}>
        <p className="eyebrow text-copper-dark">
          {String(index + 1).padStart(2, "0")} — {project.categories[0]}
        </p>
        <h3 className="font-display display-sm text-balance mt-4">
          <Link href={`/projects/${project.slug}`} className="hover:underline underline-offset-4 decoration-copper">
            {project.title}
          </Link>
        </h3>
        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-current/12 pt-5 text-sm">
          <div>
            <dt className="text-muted-light">Client</dt>
            <dd className="mt-1">{project.client}</dd>
          </div>
          <div>
            <dt className="text-muted-light">Location</dt>
            <dd className="mt-1">{project.location}</dd>
          </div>
          {project.contractLength ? (
            <div>
              <dt className="text-muted-light">Contract</dt>
              <dd className="mt-1">{project.contractLength}</dd>
            </div>
          ) : null}
          {project.value ? (
            <div>
              <dt className="text-muted-light">Value</dt>
              <dd className="mt-1">{project.value}</dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-5 text-pretty text-[0.9375rem] leading-relaxed text-muted-light">{project.summary}</p>
        <Link href={`/projects/${project.slug}`} className="group mt-6 inline-flex items-center gap-2 text-sm font-medium">
          View project
          <ArrowUpRight className="size-4 text-copper-dark transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
        </Link>
      </Reveal>
    </article>
  );
}
