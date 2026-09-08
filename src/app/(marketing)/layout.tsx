import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Footer } from "@/components/marketing/footer";
import { OrganisationJsonLd } from "@/lib/seo/json-ld";
import { AnalyticsLinks } from "@/components/marketing/analytics-links";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-copper focus:px-4 focus:py-2 focus:text-ivory"
      >
        Skip to content
      </a>
      <MarketingHeader />
      <main id="main">{children}</main>
      <Footer />
      <OrganisationJsonLd />
      <AnalyticsLinks />
    </>
  );
}
