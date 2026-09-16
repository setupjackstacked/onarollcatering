import { stock } from "./images";

/**
 * PLACEHOLDER — every person below is a labelled placeholder. No real names,
 * photographs or biographies have been invented. Replace each entry with the
 * real person once the business supplies their details and a photograph, then
 * set `placeholder: false`. Anyone still marked `placeholder: true` renders as
 * an unnamed silhouette rather than a fabricated profile, and the page tells
 * the reader the team is being photographed.
 *
 * Do not publish invented biographies. See docs/CONTENT-TODO.md.
 */
export type TeamMember = {
  slug: string;
  name: string;
  role: string;
  site?: string;
  bio: string;
  image?: string;
  placeholder: boolean;
};

export type TeamGroup = {
  key: string;
  heading: string;
  intro: string;
  members: TeamMember[];
};

export const teamPage = {
  eyebrow: "Meet the team",
  heading: "The people behind the contract",
  intro:
    "Catering on a working site succeeds or fails on the people running it. These are the people who design the kitchens, mobilise them and stand behind the counter every day.",
  // TODO(client): supply real names, roles, photographs and short biographies.
  awaitingPhotography:
    "We’re photographing the team at the moment. Full profiles will appear here shortly — in the meantime, ask us about the people who would run your contract.",
  image: stock.team,
  imageAlt: "A catering team working in a commercial kitchen",
  cta: {
    heading: "Want to meet the team that would run your contract?",
    body: "We’ll introduce the people who would design, mobilise and staff your facility — before you commit to anything.",
  },
};

export const teamGroups: TeamGroup[] = [
  {
    key: "leadership",
    heading: "Leadership",
    intro: "Accountable for the contract from first survey to daily service.",
    members: [],
  },
  {
    key: "administration",
    heading: "Administration",
    intro: "Scheduling, compliance, invoicing and the paperwork that keeps a site running.",
    members: [],
  },
  {
    key: "chefs",
    heading: "Chefs",
    intro: "The kitchen leadership who set menus, standards and throughput.",
    members: [],
  },
  {
    key: "site-teams",
    heading: "Site teams",
    intro: "The people on the counter and in the kitchen every day.",
    members: [],
  },
];

export const hasTeamProfiles = teamGroups.some((g) => g.members.some((m) => !m.placeholder));
