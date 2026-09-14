import { stock } from "./images";

export type ServiceSection = {
  heading: string;
  body: string;
  bullets?: string[];
};

export type Service = {
  slug: string;
  title: string;
  shortTitle: string;
  index: string;
  summary: string;
  intro: string;
  image: string;
  imageAlt: string;
  keywords: string[];
  sections: ServiceSection[];
  covers: string[];
  cta: { heading: string; body: string };
};

/**
 * Service pages. Copy is written from the master spec and is intentionally
 * specific. Facts about capacity, lead-times and accreditations have been
 * avoided rather than invented — add them here once confirmed.
 */
export const services: Service[] = [
  {
    slug: "commercial-catering",
    index: "01",
    title: "Commercial Catering",
    shortTitle: "Catering",
    summary:
      "Contract, workforce and construction-site catering delivered as a managed operation — infrastructure, people and food service under one contract.",
    intro:
      "We run catering as an operation, not an event. That means the kitchen, the supply chain, the team and the daily service are planned and delivered together, so a site or workplace gets a dependable service from the first day of mobilisation to the last day of the contract.",
    image: stock.commercialCatering,
    imageAlt: "Commercial catering operation in service",
    keywords: [
      "contract catering",
      "workforce catering",
      "construction site catering",
      "corporate catering",
      "industrial catering",
      "temporary site catering",
    ],
    covers: [
      "Contract catering",
      "Workforce catering",
      "Construction catering",
      "Corporate catering",
      "Industrial catering",
      "Temporary site catering",
      "Long-term catering contracts",
    ],
    sections: [
      {
        heading: "Who we serve",
        body: "Main contractors and construction consortia running large site workforces. Manufacturing, logistics and industrial operators with shift patterns. Corporate and institutional environments that need a consistent, well-run daily service rather than a one-off caterer.",
      },
      {
        heading: "How we mobilise",
        body: "Mobilisation starts with a site survey: numbers, shift times, utilities, access and any existing facilities. From that we scope the kitchen, dining and storage requirement, agree menus and service hours, and put the team and supply chain in place before day one.",
        bullets: [
          "Site survey and headcount profiling",
          "Facility scoping — existing kitchen, temporary or modular",
          "Menu, pricing and service-hour agreement",
          "Team recruitment, induction and site compliance",
          "Supplier set-up and first-week stock",
        ],
      },
      {
        heading: "Kitchen infrastructure",
        body: "Where no suitable kitchen exists we supply one. Modular and Portacabin kitchens, container conversions and temporary canteens are specified, delivered and commissioned by the same team that will operate them.",
      },
      {
        heading: "People and staffing",
        body: "Head chefs, chefs, kitchen assistants, porters, supervisors and managers are employed and managed by us for the life of the contract. Rotas, timesheets and compliance documents are handled centrally so the client is never chasing paperwork.",
      },
      {
        heading: "Food service",
        body: "Breakfast, lunch and dinner service built around shift patterns, including seven-day and extended-hours operations. Menus are designed for workforce nutrition, throughput and cost control rather than novelty.",
      },
      {
        heading: "Compliance",
        body: "Food safety management, allergen control, temperature records, hygiene ratings and site-specific health and safety requirements are built into daily operation and documented for audit.",
      },
    ],
    cta: {
      heading: "Need catering that runs itself?",
      body: "Tell us the site, the numbers and the timeline. We'll scope the kitchen, the team and the service.",
    },
  },
  {
    slug: "commercial-kitchen-design",
    index: "02",
    title: "Commercial Kitchen Design",
    shortTitle: "Kitchen Design",
    summary:
      "Workflow-led design of commercial kitchens — from brief and site survey through layout, equipment specification, utilities and commissioning.",
    intro:
      "A commercial kitchen is a production facility. We design it around the menu it has to deliver, the throughput it must sustain, the people who will work in it and the building it sits in — then carry the design through procurement, installation and handover.",
    image: stock.kitchenDesign,
    imageAlt: "Commercial kitchen layout and equipment",
    keywords: ["commercial kitchen design", "kitchen layout", "equipment specification", "kitchen consultancy"],
    covers: [
      "Brief",
      "Site survey",
      "Workflow analysis",
      "Layout",
      "Equipment specification",
      "Utilities coordination",
      "Costing",
      "Procurement",
      "Installation",
      "Commissioning",
      "Handover",
    ],
    sections: [
      {
        heading: "Brief and survey",
        body: "We start with the operational brief — covers, menu style, service periods, staffing model — and a measured site survey covering structure, drainage, ventilation routes, power and gas capacity and access for equipment.",
      },
      {
        heading: "Workflow and layout",
        body: "Layouts are built around the flow of goods in, storage, preparation, cooking, plating, service and wash-up. Clean and dirty routes are separated, cross-contamination risks removed and walking distances kept short.",
        bullets: ["Workflow", "Food safety", "Throughput", "Storage", "Ergonomics"],
      },
      {
        heading: "Equipment and services",
        body: "Equipment is specified for duty cycle, energy and maintainability, not just capital cost. Extraction, ventilation, refrigeration, electrical and plumbing requirements are coordinated with the wider building services early so nothing is redesigned on site.",
        bullets: ["Equipment", "Ventilation", "Extraction", "Durability", "Maintainability"],
      },
      {
        heading: "Costing to handover",
        body: "A fully costed schedule is produced before procurement. We then manage supply, installation, commissioning and staff handover so the kitchen is operational, compliant and understood by the team running it.",
      },
    ],
    cta: {
      heading: "Planning a new kitchen or a refit?",
      body: "Share drawings, photos or a brief and we'll come back with a scoped approach.",
    },
  },
  {
    slug: "modular-kitchens",
    index: "03",
    title: "Modular Kitchens",
    shortTitle: "Modular",
    summary:
      "Portacabin, container and modular kitchens and canteens — fully equipped, rapidly deployed, and specified for temporary or long-term use.",
    intro:
      "When a site has no kitchen, or the existing one can't cope, a modular facility is the fastest route to a compliant, productive catering operation. We specify, equip, deliver and commission modular kitchens and dining facilities as a turnkey package — and can staff and run them too.",
    image: stock.modularKitchens,
    imageAlt: "Modular kitchen unit on a construction site",
    keywords: [
      "modular kitchen",
      "portacabin kitchen",
      "container kitchen",
      "temporary kitchen",
      "site kitchen",
      "temporary canteen",
    ],
    covers: [
      "Portacabin kitchens",
      "Modular kitchens",
      "Container kitchen conversions",
      "Temporary kitchens",
      "Site kitchens",
      "Temporary canteens",
      "Dining facilities",
    ],
    sections: [
      {
        heading: "Rapid deployment",
        body: "Units are configured and equipped off-site, then delivered, connected and commissioned in a fraction of the time a built kitchen takes. Site compounds, refurbishment programmes and phased builds get a working kitchen without waiting for the permanent facility.",
      },
      {
        heading: "Bespoke configuration",
        body: "Single units for small teams through to multi-module kitchens with separate preparation, cooking, wash-up, cold storage and dining. Layout and equipment are specified to the headcount, menu and service pattern.",
        bullets: [
          "Rapid deployment",
          "Bespoke configuration",
          "Scalable capacity",
          "Temporary or long-term",
          "Fully equipped",
          "Turnkey delivery",
        ],
      },
      {
        heading: "Scalable, temporary or permanent",
        body: "Capacity can be added as a workforce grows and removed as it winds down. The same facilities serve short-term projects and multi-year contracts, with maintenance and compliance handled throughout.",
      },
      {
        heading: "Turnkey delivery",
        body: "Transport, siting, utility connection, extraction, fire safety, commissioning and handover are managed by us. If required, our own catering team then operates the facility under contract.",
      },
    ],
    cta: {
      heading: "Need a kitchen on site fast?",
      body: "Tell us the headcount, location and start date. We'll propose a modular configuration.",
    },
  },
  {
    slug: "kitchen-fit-out",
    index: "04",
    title: "Kitchen Fit-Out",
    shortTitle: "Fit-Out",
    summary:
      "New installations, refurbishments and equipment replacement — fabrication, services coordination, refrigeration, extraction and commissioning delivered as one package.",
    intro:
      "Fit-out is where design becomes a working kitchen. We manage fabrication, installation, mechanical and electrical coordination, refrigeration and extraction through to commissioning, so the client deals with one accountable contractor rather than a chain of trades.",
    image: stock.kitchenFitOut,
    imageAlt: "Commercial kitchen installation in progress",
    keywords: ["kitchen fit-out", "kitchen installation", "kitchen refurbishment", "catering equipment installation"],
    covers: [
      "New installations",
      "Refurbishments",
      "Replacement equipment",
      "Fabrication",
      "Electrical coordination",
      "Plumbing coordination",
      "Refrigeration",
      "Extraction",
      "Commissioning",
    ],
    sections: [
      {
        heading: "New installations and refurbishments",
        body: "Full fit-outs for new facilities and phased refurbishments of live kitchens, planned to minimise downtime for operations that can't stop.",
      },
      {
        heading: "Fabrication and services",
        body: "Stainless-steel fabrication, canopies and extraction, cold rooms and refrigeration, gas, electrical and plumbing works are sequenced and coordinated with building services and the wider programme.",
      },
      {
        heading: "Commissioning and handover",
        body: "Every installation is tested, certified and handed over with documentation and staff familiarisation, so the kitchen is compliant and productive from first service.",
      },
    ],
    cta: {
      heading: "Refitting or replacing a kitchen?",
      body: "Send us the scope, existing drawings or equipment schedules and we'll price the works.",
    },
  },
  {
    slug: "catering-staffing",
    index: "05",
    title: "Catering Staffing",
    shortTitle: "Staffing",
    summary:
      "Employed, managed catering teams — head chefs to kitchen porters — supplied as part of a delivered catering contract.",
    intro:
      "Our people are how a catering contract gets delivered every day. We employ, manage, rota and support the teams that run our client facilities, handling compliance, training and cover centrally so the service holds up regardless of who is on shift.",
    image: stock.cateringStaffing,
    imageAlt: "Catering team working in a commercial kitchen",
    keywords: ["catering staff", "contract catering team", "site chefs", "kitchen staff"],
    covers: [
      "Head Chefs",
      "Chefs",
      "Kitchen Assistants",
      "Kitchen Porters",
      "Catering Supervisors",
      "Catering Managers",
      "Drivers",
      "Support Staff",
    ],
    sections: [
      {
        heading: "Teams built for the contract",
        body: "Each contract gets a team sized and skilled for its menu, service periods and headcount, led by a supervisor or manager accountable for daily standards.",
      },
      {
        heading: "Managed, not just supplied",
        body: "Rotas, timesheets, right-to-work checks, food hygiene certification and site inductions are managed by us. Holiday and sickness cover is planned in, not improvised.",
      },
      {
        heading: "Part of the whole solution",
        body: "Staffing is delivered alongside the kitchen infrastructure and food service it supports. This is how we run catering contracts rather than a standalone recruitment service.",
      },
    ],
    cta: {
      heading: "Need a catering team on site?",
      body: "Tell us about the operation and we'll scope the team as part of the wider contract.",
    },
  },
  {
    slug: "bespoke-projects",
    index: "06",
    title: "Bespoke Projects",
    shortTitle: "Bespoke",
    summary:
      "Unusual sites, tight programmes and combined scopes — catering and kitchen projects that don't fit a standard package.",
    intro:
      "Some requirements don't sit neatly under one heading: a remote compound that needs kitchen, dining, staffing and supply from nothing; a live facility that needs replacing without a break in service; a multi-site rollout on a fixed programme. We scope these as projects and deliver them end to end.",
    image: stock.bespokeProjects,
    imageAlt: "Bespoke catering facility project",
    keywords: ["bespoke catering project", "catering project delivery", "kitchen project management"],
    covers: [
      "Combined design, build and operate scopes",
      "Remote and constrained sites",
      "Phased and live-environment works",
      "Multi-site programmes",
      "Equipment specification and procurement",
      "Consultancy",
    ],
    sections: [
      {
        heading: "Scoped as a project",
        body: "We define scope, programme, dependencies and cost up front, and manage the delivery through a single point of contact.",
      },
      {
        heading: "Integrated delivery",
        body: "Because design, fit-out, modular facilities, staffing and operations sit in one company, complex scopes don't need multiple contractors to be coordinated by the client.",
      },
    ],
    cta: {
      heading: "Have something that doesn't fit the mould?",
      body: "Describe the requirement. If it involves a commercial kitchen or catering operation, we can usually scope it.",
    },
  },
];

export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}
