import { CATEGORIES, PRODUCTS } from "./sample-data";
import type { CommerceProvider, Product, ProductQuery } from "./types";

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
      // Colour and size must match on the same colourway (oxblood in 45, not black in 45).
      const colorways = query.colors?.length ? p.colorways.filter((c) => query.colors!.includes(c.family)) : p.colorways;
      if (colorways.length === 0) return false;
      if (query.sizes?.length) {
        const inStock = (size: string) => p.sizes.includes(size) && colorways.some((c) => !c.soldOutSizes.includes(size));
        if (!query.sizes.some(inStock)) return false;
      }
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
