import Link from "next/link";
import { navigation, site, credibilityLine } from "@/content/site";
import { services } from "@/content/services";
import { Logo } from "./logo";
import { LinkButton } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="surface-dark relative overflow-hidden">
      <div className="container-x grid grid-cols-1 gap-12 border-t border-ivory/10 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-5">
          <Logo className="h-20 md:h-24" />
          <p className="mt-8 max-w-sm text-pretty text-[0.9375rem] leading-relaxed text-ivory/65">{site.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/quote" variant="copper" size="sm" arrow>
              Request a Quote
            </LinkButton>
            <LinkButton href="/contact" variant="outlineLight" size="sm">
              Talk to Our Team
            </LinkButton>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 md:col-span-7 md:grid-cols-3">
          <div>
            <p className="eyebrow text-ivory/45">Services</p>
            <ul className="mt-5 space-y-3">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link href={`/services/${s.slug}`} className="text-[0.9375rem] text-ivory/80 transition-colors hover:text-ivory">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow text-ivory/45">Company</p>
            <ul className="mt-5 space-y-3">
              {navigation.footer.company.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[0.9375rem] text-ivory/80 transition-colors hover:text-ivory">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="eyebrow text-ivory/45">Contact</p>
            <ul className="mt-5 space-y-3 text-[0.9375rem] text-ivory/80">
              <li>
                <a href={site.contact.phone.href} className="transition-colors hover:text-ivory">
                  {site.contact.phone.display}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.contact.email.display}`} className="break-all transition-colors hover:text-ivory">
                  {site.contact.email.display}
                </a>
              </li>
              {site.contact.address.lines.map((line) => (
                <li key={line} className="text-ivory/55">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="container-x flex flex-col gap-4 border-t border-ivory/10 py-6 text-xs text-ivory/45 md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} {site.legalName}. Established {site.established}.
          {site.companyNumber ? ` Company No. ${site.companyNumber}.` : ""}
          {site.vatNumber ? ` VAT No. ${site.vatNumber}.` : ""}
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {credibilityLine.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <ul className="flex gap-6">
          {navigation.footer.legal.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="transition-colors hover:text-ivory">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
