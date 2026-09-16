import { site } from "@/content/site";
import type { Service } from "@/content/services";

/**
 * Structured data helpers. Rendered as <script type="application/ld+json">.
 * No reviews, ratings or invented facts. LocalBusiness is deliberately not
 * emitted until an address is confirmed (spec §70).
 */

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to embed; escape closing tags defensively.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function OrganisationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: site.name,
        url: site.url,
        logo: `${site.url}/brand/logo-copper.png`,
        description: site.description,
        foundingDate: String(site.established),
        areaServed: "IE",
        ...(site.contact.email.placeholder ? {} : { email: site.contact.email.display }),
        ...(site.contact.phone.placeholder ? {} : { telephone: site.contact.phone.display }),
      }}
    />
  );
}

export function ServiceJsonLd({ service }: { service: Service }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        name: service.title,
        description: service.summary,
        serviceType: service.title,
        provider: { "@type": "Organization", name: site.name, url: site.url },
        areaServed: "IE",
        url: `${site.url}/services/${service.slug}`,
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; href: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${site.url}${item.href}`,
        })),
      }}
    />
  );
}
