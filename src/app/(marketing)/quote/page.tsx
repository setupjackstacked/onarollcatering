import type { Metadata } from "next";
import { Phone } from "lucide-react";
import { QuoteForm } from "@/components/marketing/quote-form";
import { Reveal } from "@/components/motion/reveal";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Request a Quote",
  description: "Start a commercial catering or kitchen project with On A Roll Catering. Tell us about the site, the services you need and your timeline.",
  alternates: { canonical: "/quote" },
};

type Props = { searchParams: Promise<{ service?: string }> };

export default async function QuotePage({ searchParams }: Props) {
  const { service } = await searchParams;
  return (
    <>
      <section className="surface-dark grain relative">
        <div className="container-x pb-12 pt-32 md:pb-16 md:pt-44">
          <Reveal className="max-w-3xl">
            <p className="eyebrow text-copper">Request a quote</p>
            <h1 className="font-display display-xl text-balance mt-5">Start a project</h1>
            <p className="mt-6 max-w-xl text-pretty text-lg text-ivory/70 md:text-xl">
              Four short steps. Tell us who you are, what the project is, which services you need and share any documents. We’ll come back with a scoped approach.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="surface-light">
        <div className="container-x grid grid-cols-1 gap-16 py-14 md:grid-cols-12 md:py-24">
          <div className="md:col-span-7 lg:col-span-7">
            <QuoteForm initialService={service} />
          </div>
          <aside className="md:col-span-4 md:col-start-9">
            <div className="md:sticky md:top-32">
              <p className="eyebrow text-copper-dark">What happens next</p>
              <ol className="mt-5 space-y-5">
                {[
                  ["Review", "We read the brief and any documents you've attached."],
                  ["Call", "A short call to confirm scope, site conditions and timeline."],
                  ["Survey", "A site visit where the project needs one."],
                  ["Proposal", "A costed proposal covering facility, team and service."],
                ].map(([t, b], i) => (
                  <li key={t} className="flex gap-4">
                    <span className="font-display text-xl text-copper-dark">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="font-medium">{t}</p>
                      <p className="text-sm text-muted-light">{b}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-10 border-t border-graphite/12 pt-6 text-sm text-muted-light">
                <p>Prefer to talk?</p>
                <a href={site.contact.phone.href} className="mt-2 inline-flex min-h-11 items-center gap-2 text-base text-graphite" data-analytics="phone_clicked">
                  <Phone className="size-4 text-copper-dark" aria-hidden /> {site.contact.phone.display}
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
