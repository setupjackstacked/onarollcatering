/**
 * The work gallery — On A Roll's own photographs of what they actually serve
 * and the kitchens they run it from.
 *
 * Ordered to alternate food and facility rather than grouping them, so the
 * section reads as one business doing both rather than two galleries stapled
 * together. Alt text describes the photograph, not the brand.
 */
export type GalleryImage = { src: string; alt: string };

const img = (file: string) => `/images/${file}`;

export const workGallery: GalleryImage[] = [
  { src: img("plated-beef-fillet.jpg"), alt: "Fillet of beef with potato purée and glazed carrot" },
  { src: img("hot-counter-service.jpg"), alt: "Hot counter in service, gastronorms of freshly cooked dishes" },
  { src: img("grazing-table.jpg"), alt: "Grazing table laid with charcuterie, cheeses, breads and crudités" },
  { src: img("servery-in-service.jpg"), alt: "Servery counter during lunch service" },
  { src: img("plated-seasonal-vegetables.jpg"), alt: "Plated seasonal vegetables with beetroot and carrot" },
  { src: img("breakfast-pancakes.jpg"), alt: "Pancakes with bacon, berries and compôtes" },
  { src: img("combi-oven-bank.jpg"), alt: "Bank of combi ovens in a finished kitchen" },
  { src: img("cured-salmon.jpg"), alt: "Cured salmon with pickled vegetables" },
  { src: img("canape-service.jpg"), alt: "Trays of canapés prepared for service" },
  { src: img("seafood-paella.jpg"), alt: "Seafood paella cooked in the pan" },
  { src: img("kitchen-line-extraction.jpg"), alt: "Stainless kitchen line beneath full extraction canopy" },
  { src: img("chocolate-dessert.jpg"), alt: "Chocolate tart with berries and crème" },
  { src: img("plated-duck.jpg"), alt: "Plated duck with garnish" },
  { src: img("breakfast-pastries.jpg"), alt: "Breakfast pastries and fruit laid out for service" },
  { src: img("plated-terrine.jpg"), alt: "Terrine with baby vegetables on a white plate" },
  { src: img("padron-peppers.jpg"), alt: "Padrón peppers with tomato and mozzarella" },
  { src: img("charcuterie-board.jpg"), alt: "Charcuterie and cheese board with fruit" },
  { src: img("plated-salmon.jpg"), alt: "Salmon fillet with fennel and citrus" },
  { src: img("dessert-tartlets.jpg"), alt: "Dessert tartlets with cream and berries" },
  { src: img("plated-beef-sirloin.jpg"), alt: "Sirloin of beef with seasonal garnish" },
  { src: img("grazing-platter-seasonal.jpg"), alt: "Seasonal grazing platter with fruit, cheese and cured meats" },
  { src: img("pork-belly-bowl.jpg"), alt: "Pork belly with noodles, beansprouts and egg" },
  { src: img("cakes-and-tarts.jpg"), alt: "Cakes and fruit tarts prepared for the counter" },
  { src: img("dessert-sharing-box.jpg"), alt: "Dessert sharing box with chocolate roulade and pastries" },
];

/**
 * A shorter set for the homepage, where the gallery is a taste rather than the
 * point. Both counts divide by 2, 3 and 4 so the grid never ends on a ragged
 * half-row at any breakpoint.
 */
export const homeGallery: GalleryImage[] = workGallery.slice(0, 12);
