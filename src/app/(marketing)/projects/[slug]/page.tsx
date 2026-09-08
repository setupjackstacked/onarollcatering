import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/marketing/page-hero";
import { QuoteCTA } from "@/components/marketing/quote-cta";
import { ProjectGallery } from "@/components/marketing/project-gallery";
import { ProjectFeature } from "@/components/marketing/project-feature";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { Reveal } from "@/components/motion/reveal";
import { BreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { getProject, getRelatedProjects, projects } from "@/content/projects";
import { getService } from "@/content/services";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.summary,
    alternates: { canonical: `/projects/${p.slug}` },
    // Placeholder case studies are not indexed.
    robots: p.placeholder ? { index: false, follow: true } : undefined,
    openGraph: { title: p.title, description: p.summary, images: [{ url: p.cover }] },
  };
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const related = getRelatedProjects(project);
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Projects", href: "/projects" },
    { name: project.title, href: `/projects/${project.slug}` },
  ];
  const narrative = [
    { heading: "Challenge", body: project.challenge },
    { heading: "Solution", body: project.solution },
    { heading: "Delivery", body: project.delivery },
    { heading: "Outcome", body: project.outcome },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={crumbs} />
      <PageHero
        eyebrow={project.placeholder ? "Sample case study" : project.categories.join(" · ")}
        heading={project.title}
        lead={project.summary}
        image={{ src: project.cover, alt: project.coverAlt }}
        meta={[
          { label: "Client", value: project.client },
          { label: "Location", value: project.location },
          { label: "Category", value: project.categories[0]! },
          ...(project.contractLength ? [{ label: "Contract", value: project.contractLength }] : []),
          ...(project.value ? [{ label: "Value", value: project.value }] : []),
        ]}
      >
        <Breadcrumbs items={crumbs} className="mt-10" tone="dark" />
      </PageHero>

      {project.placeholder ? (
        <div className="bg-copper/12 text-graphite">
          <p className="container-x py-3 text-sm">
            <strong>Sample content.</strong> This case study demonstrates the page layout and will be replaced with an approved project.
          </p>
        </div>
      ) : null}

      <section className="surface-light">
        <div className="container-x grid grid-cols-1 gap-12 py-20 md:grid-cols-12 md:py-32">
          <aside className="md:col-span-4">
            <div className="md:sticky md:top-32">
              <p className="eyebrow text-copper-dark">Scope</p>
              <ul className="mt-5 space-y-3">
                {project.scope.map((s) => (
                  <li key={s} className="flex items-baseline gap-3 text-[0.9375rem]">
                    <span aria-hidden className="size-1.5 shrink-0 translate-y-[-2px] rounded-full bg-copper" />
                    {s}
                  </li>
                ))}
              </ul>
              <p className="eyebrow mt-10 text-copper-dark">Services</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {project.services.map((slug) => {
                  const s = getService(slug);
                  return s ? (
                    <li key={slug}>
                      <Link href={`/services/${slug}`} className="inline-flex min-h-10 items-center rounded-full border border-graphite/20 px-4 text-sm transition-colors hover:border-graphite">
                        {s.title}
                      </Link>
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          </aside>

          <div className="md:col-span-7 md:col-start-6">
            {narrative.map((n, i) => (
              <Reveal key={n.heading} className="border-t border-graphite/12 py-10 first:border-t-0 first:pt-0 md:py-12">
                <p className="eyebrow text-copper-dark">{String(i + 1).padStart(2, "0")}</p>
                <h2 className="font-display display-sm mt-3">{n.heading}</h2>
                <p className="mt-5 max-w-prose text-pretty text-base leading-relaxed text-muted-light md:text-lg">{n.body}</p>
              </Reveal>
            ))}
            {project.outcomes.length ? (
              <Reveal className="mt-4 border-t border-graphite/12 pt-10">
                <p className="eyebrow text-copper-dark">Key outcomes</p>
                <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {project.outcomes.map((o, i) => (
                    <li key={o} className="border-l border-copper pl-4">
                      <span className="font-display text-3xl text-copper-dark">{String(i + 1).padStart(2, "0")}</span>
                      <p className="mt-2 text-[0.9375rem]">{o}</p>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ) : null}
          </div>
        </div>
      </section>

      <section className="surface-dark">
        <div className="container-x py-20 md:py-32">
          <p className="eyebrow text-copper">Gallery</p>
          <div className="mt-10">
            <ProjectGallery images={project.gallery} />
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="surface-stone">
          <div className="container-x py-20 md:py-28">
            <p className="eyebrow text-copper-dark">Related projects</p>
            <div className="mt-12 flex flex-col gap-20 md:gap-28">
              {related.map((p, i) => (
                <ProjectFeature key={p.slug} project={p} index={i} reverse={i % 2 === 1} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <QuoteCTA heading="Planning a project like this?" body="Share the brief and we'll come back with a scoped approach." />
    </>
  );
}
