/**
 * Homepage editorial content. Shaped like the Sanity documents it will come
 * from later, so swapping the source does not touch any component.
 */
import type { PosterTone } from "@/components/media/Poster";

export interface Chapter {
  id: string;
  index: string;
  title: string;
  body: string;
  /** Describes the camera framing; doubles as alt text for the still. */
  shot: string;
  /** Where the camera "looks" on the poster while this chapter is active. */
  focus: { x: number; y: number; scale: number };
  hotspot: { x: string; y: string; label: string };
}

export const hero = {
  eyebrow: "Autumn / Winter — Chapter I",
  headlineTop: "Dressed for",
  headlineBottom: "the after‑hours.",
  product: { name: "Nocturne Low", href: "/products/nocturne-low" },
  cta: { label: "Discover the Nocturne", href: "/collections/the-nocturne" },
  shot: "Nocturne Low in black calf on black velvet, lit by a single hard key light",
};

export const chapters: Chapter[] = [
  {
    id: "silhouette",
    index: "01",
    title: "The silhouette",
    body: "A low, tapered profile cut from a single piece of full‑grain calf, so no seam interrupts the line.",
    shot: "Front three‑quarter view of the Nocturne Low",
    focus: { x: 0, y: 0, scale: 1 },
    hotspot: { x: "34%", y: "52%", label: "Single‑piece calf upper" },
  },
  {
    id: "stitch",
    index: "02",
    title: "The stitch",
    body: "Tonal waxed thread, eight stitches to the inch, matched by hand to every colour.",
    shot: "Close view of the tonal stitching along the collar",
    focus: { x: -12, y: 8, scale: 1.55 },
    hotspot: { x: "58%", y: "38%", label: "Waxed tonal stitching" },
  },
  {
    id: "sole",
    index: "03",
    title: "The sole",
    body: "A natural rubber cupsole, stitched rather than glued, so a cobbler can resole it for years.",
    shot: "Low angle on the stitched rubber cupsole",
    focus: { x: 6, y: -14, scale: 1.4 },
    hotspot: { x: "46%", y: "68%", label: "Stitched rubber cupsole" },
  },
];

export const categories: { label: string; href: string; tone: PosterTone; shot: string }[] = [
  { label: "Sneakers", href: "/collections/sneakers", tone: "ink", shot: "Nocturne Low sneakers on a velvet plinth" },
  { label: "Shoes", href: "/collections/shoes", tone: "oxblood", shot: "Oxblood loafer in raking light" },
  { label: "T‑shirts", href: "/collections/t-shirts", tone: "graphite", shot: "Heavyweight tee folded on stone" },
  { label: "Jackets", href: "/collections/jackets", tone: "ink", shot: "Midnight wool overcoat on a dark form" },
  { label: "Accessories", href: "/collections/accessories", tone: "bronze", shot: "Calf card holder and belt on black glass" },
];

export const film = {
  kicker: "Campaign film",
  title: "After Hours, Chapter I",
  body: "The collection, from the atelier bench to the city after dark.",
  /** Set to the CDN URL of the encoded film once the campaign is delivered. */
  src: null as string | null,
  shot: "Still from the campaign film: a figure crossing a wet street at dusk",
};

export const journal = {
  quote: "Made for the hour when the city turns gold, then black.",
  body: "Our journal follows each collection from the first sketch to the street: the leathers, the hands that stitch them and the city that inspired them.",
  link: { label: "Read the journal", href: "/journal" },
};
