import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/marketing/page-hero";
import { QuoteCTA } from "@/components/marketing/quote-cta";
import { Reveal } from "@/components/motion/reveal";
import { teamPage, teamGroups, hasTeamProfiles } from "@/content/team";

export const metadata: Metadata = {
  title: "Meet the Team",
  description: "The people who design, mobilise and run On A Roll Catering’s kitchens and contracts.",
  alternates: { canonical: "/meet-the-team" },
  // Placeholder pages are never indexed — the same rule the sample case
  // studies follow.
  robots: hasTeamProfiles ? undefined : { index: false, follow: true },
};

export default function MeetTheTeamPage() {
  const groups = teamGroups.filter((g) => g.members.length > 0);

  return (
    <>
      <PageHero eyebrow={teamPage.eyebrow} heading={teamPage.heading} lead={teamPage.intro}
        image={{ src: teamPage.image, alt: teamPage.imageAlt }} />

      {hasTeamProfiles ? (
        groups.map((group) => (
          <section key={group.key} className="surface-light border-t border-graphite/10 first:border-t-0">
            <div className="container-x py-16 md:py-24">
              <Reveal>
                <p className="eyebrow text-copper-dark">{group.heading}</p>
                <p className="mt-3 max-w-prose text-pretty text-base leading-relaxed text-muted-light md:text-lg">{group.intro}</p>
              </Reveal>

              <ul className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {group.members.map((member, i) => (
                  <Reveal key={member.slug} as="li" delay={i * 60}>
                    <>
                      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-graphite/8">
                        {member.image ? (
                          <Image src={member.image} alt={`${member.name}, ${member.role}`} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw" className="object-cover" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-sm text-muted-light">Photograph to follow</span>
                        )}
                      </div>
                      <h2 className="font-display mt-5 text-2xl">{member.name}</h2>
                      <p className="text-sm text-copper-dark">{member.role}{member.site ? ` · ${member.site}` : ""}</p>
                      <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-light">{member.bio}</p>
                    </>
                  </Reveal>
                ))}
              </ul>
            </div>
          </section>
        ))
      ) : (
        /* No invented people. Until real profiles are supplied the page says so
           plainly and points the reader at the thing that actually helps them. */
        <section className="surface-light">
          <div className="container-x py-20 md:py-28">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="eyebrow text-copper-dark">Profiles coming soon</p>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-light">{teamPage.awaitingPhotography}</p>
            </Reveal>

            <Reveal className="mx-auto mt-14 max-w-4xl">
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {teamGroups.map((group) => (
                  <li key={group.key} className="rounded-lg border border-graphite/10 bg-white/50 p-6">
                    <p className="font-display text-xl">{group.heading}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-light">{group.intro}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>
      )}

      <QuoteCTA heading={teamPage.cta.heading} body={teamPage.cta.body} />
    </>
  );
}
