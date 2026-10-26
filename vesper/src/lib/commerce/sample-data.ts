/**
 * SAMPLE CATALOGUE for the prototype (Step 8: "decide later, prototype
 * first"). Names, copy, prices and stock are illustrative and will be
 * replaced by the chosen commerce platform's data.
 */
import { CONTENT } from "./sample-content";
import type { Category, Colorway, Product, ProductContent, ProductModel } from "./types";

const RWF = (amount: number) => ({ amount, currencyCode: "RWF" });
const EU = ["39", "40", "41", "42", "43", "44", "45", "46"];
const APPAREL = ["XS", "S", "M", "L", "XL"];

const ANGLES = {
  footwear: { front: { azimuth: 0.55, elevation: 0.3 }, alt: { azimuth: 0, elevation: 0.07 } },
  garment: { front: { azimuth: 0, elevation: 1.05 }, alt: { azimuth: 0.65, elevation: 0.55 } },
  cardholder: { front: { azimuth: 0.35, elevation: 0.7 }, alt: { azimuth: -0.6, elevation: 0.35 } },
  tote: { front: { azimuth: 0.45, elevation: 0.22 }, alt: { azimuth: -0.7, elevation: 0.3 } },
};

const model = (kind: ProductModel["kind"], style: string, angles: ProductModel["angles"], framing?: number): ProductModel => ({
  kind, style, angles, framing, standin: true,
});

const img = (slug: string, id: string) => ({
  front: `/media/products/${slug}/${id}-front.webp`,
  alt: `/media/products/${slug}/${id}-alt.webp`,
});

const T = (color: string) => ({ material: "thread" as const, color });
const ivorySole = { material: "rubber" as const, color: "#E9E2D4" };
const darkSole = { material: "rubber" as const, color: "#1A1715" };

function cw(slug: string, c: Omit<Colorway, "images" | "soldOutSizes"> & { soldOutSizes?: string[] }): Colorway {
  return { ...c, images: img(slug, c.id), soldOutSizes: c.soldOutSizes ?? [] };
}

export const CATEGORIES: Category[] = [
  { slug: "sneakers", title: "Sneakers", intro: "Low profiles in burnished calf and suede, on stitched soles built to be resoled." },
  { slug: "shoes", title: "Shoes", intro: "Loafers and derbies for the hour when the day turns formal." },
  { slug: "t-shirts", title: "T‑shirts", intro: "Heavyweight jersey, cut close and finished with a rib collar." },
  { slug: "jackets", title: "Jackets", intro: "Waxed cotton and wool, structured for evenings outdoors." },
  { slug: "accessories", title: "Accessories", intro: "Small leather goods, edge‑painted and stitched by hand." },
];

const BASE: Omit<Product, keyof ProductContent>[] = [
  {
    slug: "nocturne-low", title: "Nocturne Low", category: "sneakers", material: "Hand‑burnished calf",
    description: "A low, tapered sneaker in hand‑burnished calf, with tonal waxed stitching and a stitched rubber cupsole.",
    price: RWF(295000), sizes: EU, sizeLabel: "EU", tags: ["the-nocturne", "new"], rank: 1, releasedAt: "2026-09-20",
    model: model("footwear", "low", ANGLES.footwear),
    colorways: [
      cw("nocturne-low", { id: "black-calf", name: "Black Calf", swatch: "#151416", family: "black",
        finishes: { upper: { material: "calf", color: "#151416" }, sole: ivorySole, lining: { material: "lining", color: "#2A2522" }, thread: T("#2a2a2c"), laces: T("#121214") } }),
      cw("nocturne-low", { id: "oxblood-calf", name: "Oxblood Calf", swatch: "#5E1A1D", family: "oxblood", soldOutSizes: ["45"],
        finishes: { upper: { material: "calf", color: "#5E1A1D" }, sole: ivorySole, lining: { material: "lining", color: "#2A1A1A" }, thread: T("#4a1416"), laces: T("#3a1012") } }),
      cw("nocturne-low", { id: "ivory-suede", name: "Ivory Suede", swatch: "#E6DED0", family: "ivory", soldOutSizes: ["39", "46"],
        finishes: { upper: { material: "suede", color: "#E6DED0" }, sole: { material: "rubber", color: "#B89F80" }, lining: { material: "lining", color: "#C9B8A6" }, thread: T("#d8cfbf"), laces: T("#efe9df") } }),
    ],
  },
  {
    slug: "meridian-trainer", title: "Meridian Trainer", category: "sneakers", material: "Suede on a two‑layer sole",
    description: "A softer, sportier silhouette in brushed suede, set on a cushioned midsole over a black rubber outsole.",
    price: RWF(320000), sizes: EU, sizeLabel: "EU", tags: ["new"], rank: 3, releasedAt: "2026-10-05",
    model: model("footwear", "trainer", ANGLES.footwear),
    colorways: [
      cw("meridian-trainer", { id: "graphite-suede", name: "Graphite Suede", swatch: "#3B3A3E", family: "grey",
        finishes: { upper: { material: "suede", color: "#3B3A3E" }, midsole: ivorySole, sole: darkSole, lining: { material: "lining", color: "#2A2522" }, thread: T("#2f2e31"), laces: T("#1b1b1d") } }),
      cw("meridian-trainer", { id: "black-suede", name: "Black Suede", swatch: "#121214", family: "black", soldOutSizes: ["40"],
        finishes: { upper: { material: "suede", color: "#161618" }, midsole: { material: "rubber", color: "#26241F" }, sole: darkSole, lining: { material: "lining", color: "#1d1b1a" }, thread: T("#222224"), laces: T("#111113") } }),
    ],
  },
  {
    slug: "vesper-loafer", title: "Vesper Loafer", category: "shoes", material: "Burnished calf, penny strap",
    description: "A soft penny loafer with a hand‑stitched apron, a stacked heel and a slim rubber sole.",
    price: RWF(365000), sizes: EU, sizeLabel: "EU", tags: ["the-nocturne"], rank: 2, releasedAt: "2026-08-28",
    model: model("footwear", "loafer", ANGLES.footwear),
    colorways: [
      cw("vesper-loafer", { id: "oxblood-calf", name: "Oxblood Calf", swatch: "#5E1A1D", family: "oxblood",
        finishes: { upper: { material: "calf", color: "#5E1A1D" }, sole: darkSole, lining: { material: "lining", color: "#3a2a24" }, thread: T("#4a1416") } }),
      cw("vesper-loafer", { id: "black-calf", name: "Black Calf", swatch: "#151416", family: "black", soldOutSizes: ["39"],
        finishes: { upper: { material: "calf", color: "#151416" }, sole: darkSole, lining: { material: "lining", color: "#2a2522" }, thread: T("#2a2a2c") } }),
    ],
  },
  {
    slug: "hour-derby", title: "Hour Derby", category: "shoes", material: "Calf, Goodyear‑style welt",
    description: "An open‑laced derby on a stitched welt and leather heel, made to be worn in and resoled.",
    price: RWF(345000), sizes: EU, sizeLabel: "EU", tags: [], rank: 6, releasedAt: "2026-06-12",
    model: model("footwear", "derby", ANGLES.footwear),
    colorways: [
      cw("hour-derby", { id: "espresso-calf", name: "Espresso Calf", swatch: "#3A2A20", family: "brown",
        finishes: { upper: { material: "calf", color: "#3A2A20" }, sole: darkSole, lining: { material: "lining", color: "#C9B8A6" }, thread: T("#2a1d16"), laces: T("#1e1611") } }),
      cw("hour-derby", { id: "black-calf", name: "Black Calf", swatch: "#151416", family: "black",
        finishes: { upper: { material: "calf", color: "#151416" }, sole: darkSole, lining: { material: "lining", color: "#2a2522" }, thread: T("#2a2a2c"), laces: T("#121214") } }),
    ],
  },
  {
    slug: "heavyweight-tee", title: "Heavyweight Tee", category: "t-shirts", material: "300 g organic cotton jersey",
    description: "A dense, structured tee in organic cotton jersey, with a close rib collar and twin‑needle hems.",
    price: RWF(65000), sizes: APPAREL, sizeLabel: "Size", tags: [], rank: 4, releasedAt: "2026-07-01",
    model: model("garment", "tee", ANGLES.garment, 1.05),
    colorways: [
      cw("heavyweight-tee", { id: "ink", name: "Ink", swatch: "#18181A", family: "black",
        finishes: { body: { material: "cotton", color: "#18181A" }, thread: T("#2b2b2e") } }),
      cw("heavyweight-tee", { id: "ivory", name: "Ivory", swatch: "#E6DED0", family: "ivory", soldOutSizes: ["XS"],
        finishes: { body: { material: "cotton", color: "#E6DED0" }, thread: T("#cfc5b4") } }),
      cw("heavyweight-tee", { id: "graphite", name: "Graphite", swatch: "#4A4A4E", family: "grey",
        finishes: { body: { material: "cotton", color: "#4A4A4E" }, thread: T("#3b3b3e") } }),
    ],
  },
  {
    slug: "after-hours-long-sleeve", title: "After Hours Long Sleeve", category: "t-shirts", material: "Brushed cotton jersey",
    description: "A long‑sleeved tee in brushed jersey, cut slightly longer at the back.",
    price: RWF(85000), sizes: APPAREL, sizeLabel: "Size", tags: ["new"], rank: 8, releasedAt: "2026-10-01",
    model: model("garment", "longsleeve", ANGLES.garment, 1.05),
    colorways: [
      cw("after-hours-long-sleeve", { id: "ivory", name: "Ivory", swatch: "#E6DED0", family: "ivory",
        finishes: { body: { material: "cotton", color: "#E6DED0" }, thread: T("#cfc5b4") } }),
      cw("after-hours-long-sleeve", { id: "ink", name: "Ink", swatch: "#18181A", family: "black", soldOutSizes: ["L"],
        finishes: { body: { material: "cotton", color: "#18181A" }, thread: T("#2b2b2e") } }),
    ],
  },
  {
    slug: "field-jacket", title: "Field Jacket", category: "jackets", material: "Waxed organic cotton",
    description: "A four‑pocket field jacket in waxed cotton, with a calf‑trimmed collar and horn buttons.",
    price: RWF(480000), sizes: APPAREL, sizeLabel: "Size", tags: ["the-nocturne"], rank: 5, releasedAt: "2026-09-02",
    model: model("garment", "jacket", ANGLES.garment, 1.05),
    colorways: [
      cw("field-jacket", { id: "olive", name: "Olive", swatch: "#2E3329", family: "olive",
        finishes: { body: { material: "waxedCotton", color: "#2E3329" }, thread: T("#4b513f"), trim: { material: "calf", color: "#3A2A20" } } }),
      cw("field-jacket", { id: "black", name: "Black", swatch: "#151416", family: "black", soldOutSizes: ["XS", "XL"],
        finishes: { body: { material: "waxedCotton", color: "#17171A" }, thread: T("#2a2a2d"), trim: { material: "calf", color: "#151416" } } }),
    ],
  },
  {
    slug: "midnight-overshirt", title: "Midnight Overshirt", category: "jackets", material: "Brushed wool",
    description: "A shirt‑weight jacket in brushed wool with flap pockets, layered over a tee or knit.",
    price: RWF(410000), sizes: APPAREL, sizeLabel: "Size", tags: ["new"], rank: 7, releasedAt: "2026-10-10",
    model: model("garment", "jacket", ANGLES.garment, 1.05),
    colorways: [
      cw("midnight-overshirt", { id: "navy", name: "Midnight Navy", swatch: "#1B1E26", family: "navy",
        finishes: { body: { material: "wool", color: "#1B1E26" }, thread: T("#2a2e38"), trim: { material: "calf", color: "#1a1714" } } }),
      cw("midnight-overshirt", { id: "charcoal", name: "Charcoal", swatch: "#2E2D30", family: "grey",
        finishes: { body: { material: "wool", color: "#2E2D30" }, thread: T("#3a393c"), trim: { material: "calf", color: "#151416" } } }),
    ],
  },
  {
    slug: "calf-card-holder", title: "Calf Card Holder", category: "accessories", material: "Calf with painted edges",
    description: "Four card slots and a centre pocket, edge‑painted by hand and finished with a blind‑debossed V.",
    price: RWF(95000), sizes: ["One size"], sizeLabel: "One size", tags: ["the-nocturne"], rank: 9, releasedAt: "2026-08-15",
    model: model("accessory", "cardholder", ANGLES.cardholder),
    colorways: [
      cw("calf-card-holder", { id: "black-oxblood", name: "Black, Oxblood Edge", swatch: "#151416", family: "black",
        finishes: { body: { material: "calf", color: "#141315" }, thread: T("#2a2a2c"), edge: { material: "calf", color: "#5E1A1D" } } }),
      cw("calf-card-holder", { id: "oxblood-black", name: "Oxblood, Black Edge", swatch: "#5E1A1D", family: "oxblood",
        finishes: { body: { material: "calf", color: "#5E1A1D" }, thread: T("#3d1214"), edge: { material: "calf", color: "#151416" } } }),
    ],
  },
  {
    slug: "night-tote", title: "Night Tote", category: "accessories", material: "Calf, suede lining",
    description: "A soft structured tote in calf, lined in suede, with rolled handles stitched by hand.",
    price: RWF(420000), sizes: ["One size"], sizeLabel: "One size", tags: [], rank: 10, releasedAt: "2026-05-30",
    model: model("accessory", "tote", ANGLES.tote),
    colorways: [
      cw("night-tote", { id: "oxblood", name: "Oxblood", swatch: "#5E1A1D", family: "oxblood",
        finishes: { body: { material: "calf", color: "#5E1A1D" }, thread: T("#3d1214"), lining: { material: "suede", color: "#C9B8A6" }, edge: { material: "calf", color: "#2a0c0e" } } }),
      cw("night-tote", { id: "black", name: "Black", swatch: "#151416", family: "black",
        finishes: { body: { material: "calf", color: "#151416" }, thread: T("#2a2a2c"), lining: { material: "suede", color: "#5E1A1D" }, edge: { material: "calf", color: "#0e0d0f" } } }),
    ],
  },
];

export const PRODUCTS: Product[] = BASE.map((p) => ({ ...p, ...CONTENT[p.slug] }));
