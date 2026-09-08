/**
 * Company-level content. Anything marked `placeholder: true` or wrapped in
 * PLACEHOLDER must be confirmed by the business owner before launch.
 * See docs/CONTENT-TODO.md for the full list.
 */

export const site = {
  name: "On A Roll Catering",
  legalName: "On A Roll Catering", // PLACEHOLDER — confirm registered legal entity name
  tagline: "Complete Commercial Catering Solutions",
  description:
    "Integrated commercial catering and kitchen solutions for construction projects, corporate environments and large-scale organisations across the UK — from kitchen design and fit-out to staffing, food service and ongoing operations.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://onarollcatering.com",
  established: 2023, // from logo: ESTD 2023
  contact: {
    phone: { display: "+44 (0)000 000 0000", href: "tel:+440000000000", placeholder: true },
    email: { display: "enquiries@onarollcatering.com", placeholder: true },
    address: {
      lines: ["Registered address to be supplied"],
      placeholder: true,
    },
  },
  coverage: "Nationwide, UK", // PLACEHOLDER — confirm geographic coverage
  social: [] as { label: string; href: string }[], // PLACEHOLDER — add LinkedIn etc. when confirmed
  companyNumber: null as string | null, // PLACEHOLDER
  vatNumber: null as string | null, // PLACEHOLDER
} as const;

export const credibilityLine = [
  "Commercial Kitchens",
  "Contract Catering",
  "Modular Facilities",
  "Staffing",
  "Project Delivery",
] as const;

export const navigation = {
  primary: [
    { label: "Services", href: "/services" },
    { label: "Projects", href: "/projects" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  cta: { label: "Request a Quote", href: "/quote" },
  footer: {
    company: [
      { label: "About", href: "/about" },
      { label: "Projects", href: "/projects" },
      { label: "Contact", href: "/contact" },
      { label: "Request a Quote", href: "/quote" },
    ],
    legal: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
} as const;
