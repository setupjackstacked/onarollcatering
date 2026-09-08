import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { QuoteCTA } from "@/components/marketing/quote-cta";
import { ProjectFeature } from "@/components/marketing/project-feature";
import { ProjectFilters } from "@/components/marketing/project-filters";
import { projects, projectCategories, type ProjectCategory } from "@/content/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Case studies across commercial catering, modular kitchens, fit-out and site operations.",
  alternates: { canonical: "/projects" },
};

type Props = { searchParams: Promise<{ category?: string }> };

export default async function ProjectsPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const active = projectCategories.includes(category as ProjectCategory) ? (category as ProjectCategory) : null;
  const list = active ? projects.filter((p) => p.categories.includes(active)) : projects;

  return (
    <>
      <PageHero
        eyebrow="Projects"
        heading="Work delivered on site"
        lead="Case studies from construction compounds, industrial sites and corporate environments. Client details are published only with approval."
        compact
      />
      <section className="surface-light">
        <div className="container-x py-12 md:py-20">
          <ProjectFilters categories={projectCategories} active={active} />
          {list.length ? (
            <div className="mt-14 flex flex-col gap-20 md:mt-20 md:gap-32">
              {list.map((p, i) => (
                <ProjectFeature key={p.slug} project={p} index={i} reverse={i % 2 === 1} />
              ))}
            </div>
          ) : (
            <p className="mt-16 text-lg text-muted-light">No projects in this category yet.</p>
          )}
        </div>
      </section>
      <QuoteCTA heading="Planning something similar?" body="Tell us about the site and we'll scope the facility, the team and the programme." />
    </>
  );
}
