import { stock } from "./images";

export const hero = {
  eyebrow: "Corporate Catering & Modular Kitchen Solutions",
  headline: "Specialised Catering Solutions for Industrial and Corporate Applications",
  supporting:
    "On A Roll Catering delivers complete catering solutions for complex commercial environments.",
  /** Second paragraph of the banner. Kept separate so the opening line can hold
   *  its own weight at larger type while the detail sits beneath it. */
  supportingDetail:
    "We tailor our service to each site. We install and operate industrial kitchen facilities for small to medium-sized construction sites and corporate premises serving approximately 100–250 people. We also design, build and operate large-scale temporary catering facilities for approximately 850–2,000 people.",
  /** Sits under "Established 2023" in the banner's right-hand column. */
  establishedNote: "Can Compete in the UK and European Markets",
  primaryCta: { label: "Discuss Your Project", href: "/quote" },
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
