import { stock } from "./images";

export const hero = {
  eyebrow: "Commercial catering & kitchen solutions",
  headline: "Complete Commercial Catering Solutions",
  supporting:
    "From commercial kitchen design and fit-out to staffing, food service and ongoing operations, On A Roll delivers complete catering solutions for complex commercial environments.",
  primaryCta: { label: "Discuss Your Project", href: "/quote" },
  secondaryCta: { label: "Explore Our Services", href: "/services" },
  media: {
    /** Swap for a real image or video path. Component supports both. */
    type: "image" as "image" | "video",
    src: stock.hero,
    poster: stock.hero,
    alt: "Commercial kitchen — stainless steel preparation area",
    placeholder: true,
  },
};

export const capability = {
  eyebrow: "Capability",
  heading: "More Than Catering",
  lead: "From an empty site to a fully operational catering facility, we design, build, equip, staff and manage commercial kitchens for demanding working environments.",
  body: [
    "Most caterers arrive once the kitchen exists. Most kitchen contractors leave once it's installed. We do both — and then run the operation — so a client has one accountable partner from survey to daily service.",
    "That integration matters on construction programmes, industrial sites and corporate estates where the catering facility has to be designed, delivered and operated to the same standard as the rest of the project.",
  ],
  points: [
    { label: "Design", detail: "Workflow-led kitchen design and equipment specification" },
    { label: "Build", detail: "Fit-out, modular and Portacabin kitchens, commissioning" },
    { label: "Staff", detail: "Employed, managed catering teams" },
    { label: "Operate", detail: "Daily food service, supply chain and compliance" },
  ],
  image: stock.capability,
  imageAlt: "Chef working at the pass in a commercial kitchen",
};

export const process = {
  eyebrow: "How we work",
  heading: "One partner, end to end",
  steps: [
    {
      number: "01",
      title: "Discover",
      body: "Site survey, headcount, service pattern, utilities and constraints. We establish exactly what the operation needs before proposing anything.",
    },
    {
      number: "02",
      title: "Design",
      body: "Kitchen layout, equipment schedule, facility type — built or modular — costed and programmed against the client's timeline.",
    },
    {
      number: "03",
      title: "Deliver",
      body: "Fabrication, installation, modular deployment, commissioning and handover, coordinated with the wider project.",
    },
    {
      number: "04",
      title: "Operate",
      body: "Staffing, daily service, supply chain and compliance under a managed contract for as long as the site needs it.",
    },
  ],
};

/**
 * Statistics. `null` values are NOT rendered — the StatStrip hides itself
 * until real figures are supplied. Do not invent numbers.
 */
export const stats: { label: string; value: number | null; suffix?: string; prefix?: string }[] = [
  { label: "Years operating", value: null },
  { label: "Meals served", value: null, suffix: "+" },
  { label: "Commercial kitchens delivered", value: null },
  { label: "Long-term contracts", value: null },
  { label: "UK locations supported", value: null },
];

export const closingCta = {
  heading: "Planning a commercial catering project?",
  body: "Tell us what you need and we'll help scope the right solution.",
  cta: { label: "Start a Project", href: "/quote" },
  secondary: { label: "Talk to Our Team", href: "/contact" },
};
