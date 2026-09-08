import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { EditorialSplit } from "@/components/marketing/editorial-split";
import { ServiceShowcase } from "@/components/marketing/service-showcase";
import { ProcessTimeline } from "@/components/marketing/process-timeline";
import { ProjectFeature } from "@/components/marketing/project-feature";
import { StatStrip } from "@/components/marketing/stat-strip";
import { LogoStrip } from "@/components/marketing/logo-strip";
import { QuoteCTA } from "@/components/marketing/quote-cta";
import { SectionIntro } from "@/components/marketing/section-intro";
import { LinkButton } from "@/components/ui/button";
import { capability, closingCta } from "@/content/homepage";
import { projects } from "@/content/projects";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const featured = projects.slice(0, 2);
  return (
    <>
      <Hero />
      <LogoStrip />
      <EditorialSplit
        eyebrow={capability.eyebrow}
        heading={capability.heading}
        lead={capability.lead}
        body={[...capability.body]}
        points={[...capability.points]}
        image={{ src: capability.image, alt: capability.imageAlt }}
        tone="light"
      />
      <ServiceShowcase />
      <ProcessTimeline />
      <StatStrip />
      <section className="surface-stone">
        <div className="container-x py-20 md:py-32">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionIntro eyebrow="Projects" heading="Selected work" lead="Case studies showing how design, delivery and operation come together on site." />
            <LinkButton href="/projects" variant="outlineDark" size="md" arrow className="self-start md:self-auto">
              All projects
            </LinkButton>
          </div>
          <div className="mt-16 flex flex-col gap-20 md:mt-24 md:gap-32">
            {featured.map((p, i) => (
              <ProjectFeature key={p.slug} project={p} index={i} reverse={i % 2 === 1} />
            ))}
          </div>
        </div>
      </section>
      <QuoteCTA heading={closingCta.heading} body={closingCta.body} cta={closingCta.cta} secondary={closingCta.secondary} />
    </>
  );
}
