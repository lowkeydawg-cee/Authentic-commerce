import { PRODUCTS } from "@/lib/commerce/sample-data";
import { skuOf, type InventorySettings, type InventorySnapshot } from "./types";

export const DEFAULT_SETTINGS: InventorySettings = { lowStockThreshold: 3 };

/**
 * Demo opening stock: sizes the catalogue marks as sold out start at 0, the
 * rest get a fixed quantity (a stable hash of the SKU, so
 * every browser and the Supabase seed start from the same numbers).
 */
export function seedLevels(): Record<string, number> {
  const levels: Record<string, number> = {};
  for (const p of PRODUCTS) {
    for (const c of p.colorways) {
      for (const size of p.sizes) {
        const sku = skuOf(p.slug, c.id, size);
        let h = 2166136261;
        for (const ch of sku) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
        // About one size in ten opens low (1–2 left); the rest hold 4–12.
        const n = (h >>> 0) % 20;
        levels[sku] = c.soldOutSizes.includes(size) ? 0 : n < 2 ? n + 1 : 4 + (n % 9);
      }
    }
  }
  return levels;
}

export const SEED_LEVELS = seedLevels();

export function seedSnapshot(): InventorySnapshot {
  return { levels: { ...SEED_LEVELS }, settings: { ...DEFAULT_SETTINGS }, orders: [] };
}

/** Every variant in the catalogue, in catalogue order (drives the admin grid and the SQL seed). */
export function allVariants() {
  return PRODUCTS.flatMap((p) =>
    p.colorways.flatMap((c) => p.sizes.map((size) => ({ sku: skuOf(p.slug, c.id, size), product: p, colorway: c, size }))),
  );
}
