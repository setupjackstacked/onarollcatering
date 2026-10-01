/**
 * On A Roll Catering's own photography.
 *
 * These are the business's real kitchens, servery counters and food — not stock.
 * Files live in `public/images/` and are served through next/image, so changing
 * a photograph means replacing the file or re-pointing a key here; no component
 * changes are needed.
 *
 * The export is still called `stock` so that every page importing it kept
 * working when the placeholders were replaced. The name is a leftover, not a
 * description.
 *
 * Replacing one: drop the new file in `public/images/`, point the key at it.
 * Keep images under about 2000px on the long edge and run them through an
 * optimiser first — next/image resizes but does not re-compress the original.
 */
const img = (file: string) => `/images/${file}`;

export const stock = {
  /** Wide shot of a finished dining room and branded servery. Carries the brand and the scale. */
  hero: img("dining-and-servery.jpg"),
  /** Chefs working a live service — people, not empty rooms. */
  capability: img("kitchen-in-service.jpg"),

  // Services
  commercialCatering: img("servery-counter-daylight.jpg"),
  kitchenDesign: img("kitchen-ranges-complete.jpg"),
  modularKitchens: img("modular-kitchen-exterior.jpg"),
  kitchenFitOut: img("combi-oven-bank.jpg"),
  cateringStaffing: img("kitchen-team-at-work.jpg"),
  bespokeProjects: img("modular-kitchen-interior.jpg"),

  // Project / case-study covers
  projectConstruction: img("fit-out-structure.jpg"),
  projectCorporate: img("servery-counter-branded.jpg"),
  projectIndustrial: img("servery-in-service.jpg"),

  about: img("chef-at-the-pass.jpg"),

  // Gallery
  galleryServing: img("sharing-platter.jpg"),
  galleryWarehouse: img("kitchen-line-extraction.jpg"),
  galleryFridge: img("cold-room.jpg"),
  galleryConstruction: img("fit-out-in-progress.jpg"),

  team: img("kitchen-team-at-work.jpg"),
  og: img("dining-and-servery.jpg"),
} as const;

/**
 * Photographs supplied but not yet placed. Kept because they are the strongest
 * material for real case studies once those are written — a finished plate and
 * a servery being installed say more about the business than another empty room.
 */
export const unplaced = {
  platedTerrine: img("plated-terrine.jpg"),
  stainlessStorage: img("stainless-storage.jpg"),
  serveryInstallation: img("servery-installation.jpg"),
} as const;
