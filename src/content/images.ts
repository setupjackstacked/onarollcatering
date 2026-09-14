/**
 * Placeholder photography — Unsplash (Unsplash License: free for commercial use,
 * no attribution required, hotlinked via images.unsplash.com and optimised by next/image).
 * These are stand-ins so the client can review the site with real-looking imagery.
 * Replace with the company's own photography before launch (docs/CONTENT-TODO.md).
 */
const u = (id: string, w = 2000) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const stock = {
  hero: u("photo-1589109807644-924edf14ee09", 2400), // clean stainless commercial kitchen, bright
  capability: u("photo-1769955821416-9273532bb148"), // chef at pass, dramatic light
  commercialCatering: u("photo-1788230548191-9e1ba2942569"), // stainless serving line
  kitchenDesign: u("photo-1708915965975-2a950db0e215"), // commercial range + prep
  modularKitchens: u("photo-1583939425168-adc7e05386a4"), // site cabin on construction site
  kitchenFitOut: u("photo-1785306589604-1c6ebaee741f"), // ductwork / extraction
  cateringStaffing: u("photo-1666479258732-5ea17469b610"), // chef working in stainless kitchen
  bespokeProjects: u("photo-1696324535687-6bb987f50e96"), // shipping container
  projectConstruction: u("photo-1589624613207-a967e5c76bc6"), // site cabins on compound
  projectCorporate: u("photo-1627931085762-4017812f1773"), // stainless kitchen with extraction
  projectIndustrial: u("photo-1520209268518-aec60b8bb5ca"), // canteen in use
  about: u("photo-1604414499020-f9ac575bc5ec"), // stainless pots, chrome
  galleryServing: u("photo-1623475173140-ad2f0369ca92"), // chafing dishes
  galleryWarehouse: u("photo-1772305336606-989a457ffbae"), // industrial warehouse interior
  galleryFridge: u("photo-1782750161991-23529c9462bb"), // commercial refrigerator
  galleryConstruction: u("photo-1694521787162-5373b598945c"), // construction site from above
  og: u("photo-1589109807644-924edf14ee09", 1200),
} as const;
