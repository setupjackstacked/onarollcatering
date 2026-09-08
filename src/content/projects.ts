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
 * ALL ENTRIES BELOW ARE PLACEHOLDERS. They demonstrate the page architecture
 * and must be replaced with real, approved client facts before launch.
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
      "PLACEHOLDER — describe the site conditions, workforce numbers, service hours and constraints the client faced.",
    solution:
      "PLACEHOLDER — describe the facility specified, how it was configured and how the team and service were structured.",
    delivery:
      "PLACEHOLDER — describe mobilisation timeline, phasing and how disruption was avoided.",
    outcome:
      "PLACEHOLDER — describe the result: service levels, uptime, workforce feedback, contract extensions.",
    outcomes: ["Sample outcome one", "Sample outcome two", "Sample outcome three"],
    services: ["commercial-catering", "modular-kitchens", "catering-staffing"],
    cover: "/images/placeholders/project-1.jpg",
    coverAlt: "Placeholder — construction site catering facility",
    gallery: [
      { src: "/images/placeholders/project-1.jpg", alt: "Placeholder gallery image" },
      { src: "/images/placeholders/modular-kitchens.jpg", alt: "Placeholder gallery image" },
      { src: "/images/placeholders/commercial-catering.jpg", alt: "Placeholder gallery image" },
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
    challenge: "PLACEHOLDER — describe the brief and constraints.",
    solution: "PLACEHOLDER — describe the design and specification decisions.",
    delivery: "PLACEHOLDER — describe programme and coordination with building services.",
    outcome: "PLACEHOLDER — describe the delivered result.",
    outcomes: ["Sample outcome one", "Sample outcome two"],
    services: ["commercial-kitchen-design", "kitchen-fit-out"],
    cover: "/images/placeholders/project-2.jpg",
    coverAlt: "Placeholder — corporate kitchen fit-out",
    gallery: [
      { src: "/images/placeholders/project-2.jpg", alt: "Placeholder gallery image" },
      { src: "/images/placeholders/kitchen-design.jpg", alt: "Placeholder gallery image" },
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
    challenge: "PLACEHOLDER — describe the brief and constraints.",
    solution: "PLACEHOLDER — describe the operating model.",
    delivery: "PLACEHOLDER — describe mobilisation.",
    outcome: "PLACEHOLDER — describe the delivered result.",
    outcomes: ["Sample outcome one", "Sample outcome two"],
    services: ["commercial-catering", "catering-staffing"],
    cover: "/images/placeholders/project-3.jpg",
    coverAlt: "Placeholder — industrial workforce catering",
    gallery: [{ src: "/images/placeholders/project-3.jpg", alt: "Placeholder gallery image" }],
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
