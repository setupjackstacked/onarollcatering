import type { Metadata } from "next";
import { Phone, Mail, MapPin } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { ContactForm } from "@/components/marketing/contact-form";
import { LinkButton } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to On A Roll Catering about commercial catering, modular kitchens, kitchen design and fit-out.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" heading="Talk to our team" lead="For project enquiries the quickest route is the project form — it captures what we need to scope properly. For anything else, use the details below." compact />

      <section className="surface-light">
        <div className="container-x grid grid-cols-1 gap-16 py-20 md:grid-cols-12 md:py-32">
          <Reveal className="md:col-span-5">
            <div className="surface-dark grain relative overflow-hidden p-8 md:p-10">
              <p className="eyebrow text-copper">Have a project?</p>
              <p className="mt-4 font-display text-3xl text-balance md:text-4xl">Start a project and we’ll scope it with you.</p>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-ivory/65">Kitchen, catering, staffing or all three — the project form takes about five minutes and lets you attach drawings or tender documents.</p>
              <LinkButton href="/quote" variant="copper" size="lg" arrow className="mt-8">
                Start a Project
              </LinkButton>
            </div>

            <ul className="mt-12 space-y-6">
              <li className="flex gap-4">
                <Phone className="mt-1 size-5 shrink-0 text-copper-dark" aria-hidden />
                <div>
                  <p className="eyebrow text-muted-light">Phone</p>
                  <a href={site.contact.phone.href} className="mt-1 block text-lg" data-analytics="phone_clicked">
                    {site.contact.phone.display}
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <Mail className="mt-1 size-5 shrink-0 text-copper-dark" aria-hidden />
                <div>
                  <p className="eyebrow text-muted-light">Email</p>
                  <a href={`mailto:${site.contact.email.display}`} className="mt-1 block break-all text-lg" data-analytics="contact_clicked">
                    {site.contact.email.display}
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <MapPin className="mt-1 size-5 shrink-0 text-copper-dark" aria-hidden />
                <div>
                  <p className="eyebrow text-muted-light">Address</p>
                  <address className="mt-1 not-italic text-lg text-muted-light">
                    {site.contact.address.lines.map((l) => (
                      <span key={l} className="block">
                        {l}
                      </span>
                    ))}
                  </address>
                </div>
              </li>
            </ul>
          </Reveal>

          <Reveal delay={100} className="md:col-span-6 md:col-start-7">
            <p className="eyebrow text-copper-dark">General enquiry</p>
            <h2 className="font-display display-sm mt-3">Send a message</h2>
            <div className="mt-8">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
