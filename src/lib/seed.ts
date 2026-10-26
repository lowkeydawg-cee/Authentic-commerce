import type { Category, Product, StoreSettings } from "./types";

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Authentic",
  heroEyebrow: "The Autumn Edit · Crafted in Kigali",
  heroTitle: "Objects of quiet luxury, made to last.",
  heroSubtitle:
    "Hand-finished leather, precision timepieces and artisan homeware — curated in small batches and delivered across Rwanda.",
  currency: "RWF",
  lowStockThreshold: 5,
};

export const SEED_CATEGORIES: Category[] = [
  { id: "cat-accessories", name: "Accessories", slug: "accessories", visible: true, sortOrder: 1 },
  { id: "cat-audio", name: "Audio", slug: "audio", visible: true, sortOrder: 2 },
  { id: "cat-apparel", name: "Apparel", slug: "apparel", visible: true, sortOrder: 3 },
  { id: "cat-home", name: "Home", slug: "home", visible: true, sortOrder: 4 },
];

const now = new Date("2026-10-01T09:00:00.000Z").toISOString();

function p(
  id: string,
  sku: string,
  title: string,
  description: string,
  categoryId: string,
  price: number,
  stock: number,
  accent: Product["accent"],
  featured = false,
): Product {
  return {
    id,
    sku,
    title,
    description,
    categoryId,
    price,
    stock,
    visible: true,
    featured,
    imageUrl: null,
    accent,
    createdAt: now,
    updatedAt: now,
  };
}

export const SEED_PRODUCTS: Product[] = [
  p("prd-1", "ACC-WCH-001", "Meridian Chronograph", "Sapphire crystal, brushed steel case and a hand-stitched Imigongo-pattern strap.", "cat-accessories", 485000, 12, "amber", true),
  p("prd-2", "ACC-BAG-002", "Volcanoes Leather Tote", "Full-grain leather tote, hand-finished edges and brass hardware.", "cat-accessories", 210000, 4, "rose", true),
  p("prd-3", "ACC-GLS-003", "Lakeside Sunglasses", "Polarised acetate frames with UV400 protection.", "cat-accessories", 95000, 0, "sky"),
  p("prd-4", "AUD-HDP-004", "Aura Studio Headphones", "Active noise cancelling, 40-hour battery and memory-foam cushions.", "cat-audio", 320000, 18, "violet", true),
  p("prd-5", "AUD-SPK-005", "Ember Portable Speaker", "Room-filling 360° sound in a walnut and wool enclosure.", "cat-audio", 175000, 3, "emerald"),
  p("prd-6", "APP-JKT-006", "Nyungwe Field Jacket", "Waxed organic cotton with a quilted merino lining.", "cat-apparel", 260000, 9, "emerald"),
  p("prd-7", "APP-SHR-007", "Atelier Linen Shirt", "Breathable Belgian linen, mother-of-pearl buttons.", "cat-apparel", 78000, 25, "slate"),
  p("prd-8", "HOM-CFE-008", "Kivu Single-Origin Coffee Set", "Hand-thrown ceramic pour-over set with 500g of Lake Kivu beans.", "cat-home", 68000, 2, "amber"),
  p("prd-9", "HOM-LMP-009", "Agaseke Woven Lamp", "Sisal pendant woven by artisan cooperatives in the Southern Province.", "cat-home", 135000, 7, "rose"),
];
