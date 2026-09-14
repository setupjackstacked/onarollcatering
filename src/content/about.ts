import { stock } from "./images";

export const about = {
  eyebrow: "About On A Roll",
  heading: "Built to deliver catering as a commercial project",
  story: [
    "On A Roll Catering was established in 2023 to provide integrated commercial catering and kitchen solutions for businesses, construction projects, corporate environments and large-scale organisations.",
    // TODO(client): founder background and company history — confirm before launch.
    "The business was set up to close a gap clients kept running into: kitchen contractors who leave once the equipment is installed, and caterers who only arrive once a kitchen exists. On A Roll brings design, fit-out, modular facilities, staffing and daily food service together under one contract, so a client has a single accountable partner from survey to service.",
  ],
  approach: {
    heading: "Our approach",
    body: "We treat every engagement as a project with a scope, a programme and an outcome. The kitchen, the team and the food service are planned together, because on a working site they fail together if they aren't.",
  },
  capabilities: [
    "Commercial contract and workforce catering",
    "Construction-site and temporary catering",
    "Modular and Portacabin kitchen facilities",
    "Commercial kitchen design and equipment specification",
    "Kitchen fit-out, installation and commissioning",
    "Employed and managed catering teams",
    "Project mobilisation and ongoing operations",
  ],
  values: [
    { title: "Accountable", body: "One contract, one point of contact, one team responsible for the result." },
    { title: "Practical", body: "Specifications and menus designed for throughput, cost and durability — not for show." },
    { title: "Compliant", body: "Food safety, workforce compliance and site rules are built into daily operation and evidenced." },
    { title: "Dependable", body: "Cover, supply and maintenance are planned in so service holds up every day of the contract." },
  ],
  experience: {
    heading: "Experience",
    // TODO(client): named clients / logos only once approved.
    body: "We work with main contractors, industrial operators and corporate estates on catering facilities that have to perform every day. Client references and case studies are available on request.",
  },
  leadership: [] as { name: string; role: string; bio: string; image?: string }[], // PLACEHOLDER — supply if wanted
  coverage: {
    heading: "Where we work",
    // TODO(client): confirm regions / nationwide coverage.
    body: "We mobilise for projects and contracts across the UK, from single-site facilities to multi-site programmes.",
  },
  image: stock.about,
  imageAlt: "Stainless steel cookware in a commercial kitchen",
};
