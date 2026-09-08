import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/marketing/page-hero";
import { QuoteCTA } from "@/components/marketing/quote-cta";
import { ProjectFeature } from "@/components/marketing/project-feature";
import { Reveal } from "@/components/motion/reveal";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { ServiceJsonLd, BreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { getService, services } from "@/content/services";
import { projects } from "@/content/projects";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.summary,
    keywords: service.keywords,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: { title: service.title, description: service.summary, images: [{ url: service.image }] },
  };
}

export default async function ServicePage({ params }: Params) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const related = projects.filter((p) => p.services.includes(service.slug)).slice(0, 1);
  const others = services.filter((s) => s.slug !== service.slug);
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: service.title, href: `/services/${service.slug}` },
  ];

  return (
    <>
      <ServiceJsonLd service={service} />
      <BreadcrumbJsonLd items={crumbs} />
      <PageHero
        eyebrow={`Service ${service.index}`}
        heading={service.title}
        lead={service.intro}
        image={{ src: service.image, alt: service.imageAlt }}
      >
        <Breadcrumbs items={crumbs} className="mt-10" tone="dark" />
      </PageHero>

      {/* Covers rail */}
      <div className="surface-graphite border-t border-ivory/10">
        <div className="container-x py-5">
          <ul className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
            {service.covers.map((c) => (
              <li key={c} className="shrink-0 rounded-full border border-ivory/20 px-4 py-2 text-sm text-ivory/80">
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sections — sticky index on desktop */}
      <section className="surface-light">
        <div className="container-x grid grid-cols-1 gap-12 py-20 md:grid-cols-12 md:py-32">
          <aside className="md:col-span-3">
            <div className="md:sticky md:top-32">
              <p className="eyebrow text-copper-dark">In this service</p>
              <ol className="mt-4 space-y-2">
                {service.sections.map((s, i) => (
                  <li key={s.heading}>
                    <a href={`#s-${i}`} className="flex gap-3 text-sm text-muted-light transition-colors hover:text-graphite">
                      <span className="font-display text-copper-dark">{String(i + 1).padStart(2, "0")}</span>
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
          <div className="md:col-span-8 md:col-start-5">
            {service.sections.map((s, i) => (
              <Reveal key={s.heading} className="border-t border-graphite/12 py-10 first:border-t-0 first:pt-0 md:py-14">
                <h2 id={`s-${i}`} className="font-display display-sm scroll-mt-32 text-balance">
                  {s.heading}
                </h2>
                <p className="mt-5 max-w-prose text-pretty text-base leading-relaxed text-muted-light md:text-lg">{s.body}</p>
                {s.bullets?.length ? (
                  <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-baseline gap-3 text-[0.9375rem]">
                        <span aria-hidden className="size-1.5 shrink-0 translate-y-[-2px] rounded-full bg-copper" />
                        {b}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="surface-stone">
          <div className="container-x py-20 md:py-28">
            <p className="eyebrow text-copper-dark">Related project</p>
            <div className="mt-10">
              {related.map((p) => (
                <ProjectFeature key={p.slug} project={p} index={0} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <QuoteCTA heading={service.cta.heading} body={service.cta.body} cta={{ label: "Discuss Your Project", href: `/quote?service=${service.slug}` }} />

      {/* Other services */}
      <section className="surface-graphite border-t border-ivory/10">
        <div className="container-x py-14">
          <p className="eyebrow text-ivory/45">Other services</p>
          <ul className="mt-6 grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-5">
            {others.map((s) => (
              <li key={s.slug} className="border-t border-ivory/10">
                <Link href={`/services/${s.slug}`} className="group flex items-center gap-4 py-4">
                  <span className="relative size-12 shrink-0 overflow-hidden">
                    <Image src={s.image} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                  <span className="text-[0.9375rem] text-ivory/80 transition-colors group-hover:text-ivory">{s.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
