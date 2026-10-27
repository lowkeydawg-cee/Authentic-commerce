import type { StandinSpec } from "@/three/standins";

/**
 * Commerce domain types. The storefront only depends on these and on the
 * `CommerceProvider` interface, so the headless platform (Shopify, Medusa,
 * Supabase…) can be chosen later without touching UI code.
 */
export interface Money {
  amount: number;
  currencyCode: string;
}

export type CategorySlug = "sneakers" | "shoes" | "t-shirts" | "jackets" | "accessories";

export interface Category {
  slug: CategorySlug;
  title: string;
  intro: string;
}

export type ColorFamily = "black" | "ivory" | "oxblood" | "grey" | "olive" | "navy" | "brown";

export const COLOR_FAMILIES: { id: ColorFamily; label: string; swatch: string }[] = [
  { id: "black", label: "Black", swatch: "#151416" },
  { id: "ivory", label: "Ivory", swatch: "#E6DED0" },
  { id: "oxblood", label: "Oxblood", swatch: "#5E1A1D" },
  { id: "grey", label: "Grey", swatch: "#4A4A4E" },
  { id: "olive", label: "Olive", swatch: "#2E3329" },
  { id: "navy", label: "Navy", swatch: "#1B1E26" },
  { id: "brown", label: "Brown", swatch: "#3A2A20" },
];

export interface Colorway {
  id: string;
  name: string;
  /** Swatch colour shown in pickers. */
  swatch: string;
  /** Colour family used by the collection filter. */
  family: ColorFamily;
  images: { front: string; alt: string };
  /** Material finishes for the 3D model (stand-in today, GLB material variants later). */
  finishes: Extract<StandinSpec, { kind: string }>["finishes"];
  soldOutSizes: string[];
}

export interface ProductModel {
  kind: StandinSpec["kind"];
  style: string;
  framing?: number;
  /** Poster camera angles in radians. */
  angles: { front: { azimuth: number; elevation: number }; alt: { azimuth: number; elevation: number } };
  /** True until the Blender GLB replaces the procedural stand-in. */
  standin: boolean;
}

/** A construction detail; also a 3D hotspot (anchor = named empty in the model). */
export interface Highlight {
  id: string;
  anchor: string;
  kicker: string;
  title: string;
  body: string;
}

export interface ProductContent {
  details: string[];
  care: string[];
  /** Fit guidance shown beside the size picker. */
  fit: string;
  highlights: Highlight[];
}

export interface Product extends ProductContent {
  slug: string;
  title: string;
  category: CategorySlug;
  /** One-line material summary for cards, e.g. "Hand-burnished calf". */
  material: string;
  description: string;
  price: Money;
  colorways: Colorway[];
  sizes: string[];
  sizeLabel: "EU" | "Size" | "One size";
  tags: ("new" | "the-nocturne")[];
  /** Lower ranks first in the "Featured" sort. */
  rank: number;
  releasedAt: string;
  model: ProductModel;
}

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc";

export interface ProductQuery {
  category?: CategorySlug;
  edit?: "new" | "the-nocturne";
  colors?: string[]; // colour family ids
  sizes?: string[];
  sort?: SortKey;
  /** Free-text search: every word must match the title, material, description, category or a colour. */
  search?: string;
}

export interface CommerceProvider {
  listCategories(): Promise<Category[]>;
  listProducts(query?: ProductQuery): Promise<Product[]>;
  getProduct(slug: string): Promise<Product | null>;
}
