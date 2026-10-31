import { CATEGORIES, PRODUCTS } from "./sample-data";
import type { CommerceProvider, Product, ProductQuery } from "./types";

const fold = (s: string) => s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[\u2010-\u2015]/g, "-").toLowerCase();

function matches(p: Product, search: string) {
  const category = CATEGORIES.find((c) => c.slug === p.category)?.title ?? "";
  const haystack = fold([p.title, p.material, p.description, category, p.category, ...p.colorways.flatMap((c) => [c.name, c.family])].join(" "));
  // Loose plural handling: "sneakers" finds "sneaker", "loafers" finds "loafer".
  return fold(search).split(/\s+/).filter(Boolean).every((w) => haystack.includes(w) || (w.length > 3 && w.endsWith("s") && haystack.includes(w.slice(0, -1))));
}

/** In-memory provider over the sample catalogue. Same contract as a real platform adapter. */
export const sampleProvider: CommerceProvider = {
  async listCategories() {
    return CATEGORIES;
  },

  async getProduct(slug) {
    return PRODUCTS.find((p) => p.slug === slug) ?? null;
  },

  async listProducts(query: ProductQuery = {}) {
    let list = PRODUCTS.filter((p) => {
      if (query.category && p.category !== query.category) return false;
      if (query.edit && !p.tags.includes(query.edit)) return false;
      if (query.search && !matches(p, query.search)) return false;
      const colorways = query.colors?.length ? p.colorways.filter((c) => query.colors!.includes(c.family)) : p.colorways;
      if (colorways.length === 0) return false;
      // Sizes the piece is made in. Live availability is shown on the cards and product page.
      if (query.sizes?.length && !query.sizes.some((size) => p.sizes.includes(size))) return false;
      return true;
    });
    const by: Record<NonNullable<ProductQuery["sort"]>, (a: Product, b: Product) => number> = {
      featured: (a, b) => a.rank - b.rank,
      newest: (a, b) => b.releasedAt.localeCompare(a.releasedAt),
      "price-asc": (a, b) => a.price.amount - b.price.amount,
      "price-desc": (a, b) => b.price.amount - a.price.amount,
    };
    list = [...list].sort(by[query.sort ?? "featured"]);
    return list;
  },
};
