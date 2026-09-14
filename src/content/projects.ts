import { stock } from "./images";

export type ProjectCategory =
  | "Commercial Catering"
  | "Modular Kitchen"
  | "Kitchen Fit-Out"
  | "Corporate"
  | "Construction"
  | "Industrial";

export type Project = {
  slug: string;
  /** PLACEHOLDER projects are rendered with a visible "sample" label and excluded from sitemap/SEO. */
  placeholder: boolean;
  title: string;
  client: string;
  location: string;
  categories: ProjectCategory[];
  summary: string;
  scope: string[];
  value?: string;
  contractLength?: string;
  challenge: string;
  solution: string;
  delivery: string;
  outcome: string;
  outcomes: string[];
  services: string[]; // service slugs
  cover: string;
  coverAlt: string;
  gallery: { src: string; alt: string }[];
  year?: number;
};

/**
 * Case studies.
 *
 * ALL ENTRIES BELOW ARE ILLUSTRATIVE SAMPLES (placeholder: true). Narratives are
 * generic and contain no real figures, clients or locations. Replace with approved
 * case studies before launch.
 * No real client names are used. Pfizer must not be referenced or implied
 * until the business owner explicitly approves it.
 */
export const projects: Project[] = [
  {
    slug: "sample-construction-site-catering",
    placeholder: true,
    title: "Site-wide catering for a major infrastructure compound",
    client: "Sample client — confidential",
    location: "Sample location, UK",
    categories: ["Commercial Catering", "Construction", "Modular Kitchen"],
    summary:
      "Sample case study: a modular kitchen and canteen deployed and operated for a large construction workforce on a multi-year programme.",
    scope: ["Modular kitchen and dining facility", "Full catering team", "Seven-day food service", "Supply chain and compliance"],
    challenge:
      "A large construction workforce on a remote compound with no existing catering facility, staggered shift patterns and a programme that would run for several years. The client needed a facility and a service that could be up and running before the main workforce arrived, then scale as headcount grew.",
    solution:
      "A modular kitchen and dining facility was specified to the projected headcount, with cold storage, wash-up and a serving line sized for peak periods. On A Roll supplied the facility, the team and the supply chain under one contract, with menus built around workforce nutrition and shift timings.",
    delivery:
      "Units were fitted out off-site, delivered and connected in sequence with the compound build, and commissioned before the first shift. Additional capacity was added as the workforce increased, without interrupting service.",
    outcome:
      "A dependable daily service for the life of the programme, managed centrally so the client’s site team were never chasing staffing, compliance or supply.",
    outcomes: ["Facility operational before workforce arrival", "Capacity scaled with headcount", "Single contract for facility, team and service"],
    services: ["commercial-catering", "modular-kitchens", "catering-staffing"],
    cover: stock.projectConstruction,
    coverAlt: "Site accommodation cabins on a construction compound",
    gallery: [
      { src: stock.galleryConstruction, alt: "Construction site" },
      { src: stock.modularKitchens, alt: "Site cabin" },
      { src: stock.galleryServing, alt: "Serving line" },
    ],
  },
  {
    slug: "sample-corporate-kitchen-fit-out",
    placeholder: true,
    title: "Design and fit-out of a corporate production kitchen",
    client: "Sample client — confidential",
    location: "Sample location, UK",
    categories: ["Kitchen Fit-Out", "Corporate"],
    summary:
      "Sample case study: full design, equipment specification and installation of a staff-restaurant kitchen in a live office environment.",
    scope: ["Kitchen design", "Equipment specification", "Extraction and refrigeration", "Phased installation", "Commissioning"],
    challenge:
      "An ageing staff-restaurant kitchen in an occupied office building, with limited plant space, restricted delivery hours and a requirement to keep the building operating throughout the works.",
    solution:
      "A workflow-led redesign separated goods-in, preparation, cooking and wash-up, with equipment specified for duty cycle and maintainability. Extraction and refrigeration were coordinated with the building’s existing services early to avoid redesign on site.",
    delivery:
      "Works were phased around the building’s occupancy and delivery windows, with fabrication completed off-site and installation, testing and commissioning carried out in agreed slots.",
    outcome:
      "A compliant, productive kitchen handed over with full documentation and team familiarisation, delivered without closing the building.",
    outcomes: ["Live building kept operational", "Services coordinated with landlord", "Full commissioning and handover pack"],
    services: ["commercial-kitchen-design", "kitchen-fit-out"],
    cover: stock.projectCorporate,
    coverAlt: "Stainless steel kitchen with extraction canopy",
    gallery: [
      { src: stock.galleryFridge, alt: "Commercial refrigeration" },
      { src: stock.kitchenDesign, alt: "Commercial cooking range" },
      { src: stock.kitchenFitOut, alt: "Extraction ductwork" },
    ],
  },
  {
    slug: "sample-industrial-workforce-catering",
    placeholder: true,
    title: "Shift-pattern catering for an industrial manufacturing site",
    client: "Sample client — confidential",
    location: "Sample location, UK",
    categories: ["Commercial Catering", "Industrial"],
    summary:
      "Sample case study: a 24-hour catering operation serving rotating shifts, with menus and staffing built around production patterns.",
    scope: ["Contract catering", "Extended-hours service", "Team management", "Compliance and audit"],
    challenge:
      "A manufacturing site running rotating shifts around the clock, where the previous catering arrangement covered daytime only and left night and weekend shifts without a hot service.",
    solution:
      "A managed catering operation built around the production pattern: extended-hours service, menus planned for shift nutrition and throughput, and an employed team rota’d to cover every shift including weekends.",
    delivery:
      "Mobilised in stages — team recruitment and induction, supplier set-up and site compliance — so the service went live without disrupting production.",
    outcome:
      "Consistent hot food for every shift, managed centrally with compliance records maintained for audit.",
    outcomes: ["Every shift covered, seven days", "Menus aligned to production pattern", "Audit-ready compliance records"],
    services: ["commercial-catering", "catering-staffing"],
    cover: stock.projectIndustrial,
    coverAlt: "Workforce canteen in service",
    gallery: [
      { src: stock.galleryWarehouse, alt: "Industrial facility" },
      { src: stock.commercialCatering, alt: "Serving counter" },
    ],
  },
];

export const projectCategories: ProjectCategory[] = [
  "Commercial Catering",
  "Modular Kitchen",
  "Kitchen Fit-Out",
  "Corporate",
  "Construction",
  "Industrial",
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export function getRelatedProjects(project: Project, limit = 2) {
  return projects
    .filter((p) => p.slug !== project.slug)
    .sort(
      (a, b) =>
        b.categories.filter((c) => project.categories.includes(c)).length -
        a.categories.filter((c) => project.categories.includes(c)).length,
    )
    .slice(0, limit);
}
