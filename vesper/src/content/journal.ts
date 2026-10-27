/**
 * Journal articles. Shaped like the CMS documents they will come from, so
 * swapping the source does not touch any component. Images are stand-in
 * renders until campaign photography is delivered.
 */

export type JournalBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "figure"; src: string; alt: string; caption: string }
  | { type: "products"; title: string; slugs: string[] };

export interface Article {
  slug: string;
  kicker: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  cover: { src: string; alt: string };
  body: JournalBlock[];
}

export const ARTICLES: Article[] = [
  {
    slug: "chapter-i-the-nocturne",
    kicker: "The collection",
    title: "Chapter I: The Nocturne",
    excerpt: "Burnished calf, oxblood and black. How the first chapter took its colours from the hour after sunset.",
    publishedAt: "2026-10-01",
    cover: { src: "/media/journal/chapter-i.webp", alt: "Nocturne Low in oxblood calf, lit low from the side" },
    body: [
      { type: "p", text: "Every chapter starts with an hour of the day. For the first, we chose the one just after sunset, when the light over the hills turns gold, then copper, then disappears, and the streets take on the colour of the lamps." },
      { type: "p", text: "That hour gave us the palette. Black, for the night itself. Oxblood, for the last of the light on brick and leather. Ivory, for the lamps. Nothing in the collection strays far from those three." },
      { type: "h2", text: "One sneaker, three moods" },
      { type: "p", text: "The Nocturne Low sits at the centre of the chapter. Its upper is cut from a single piece of full‑grain calf, so no seam interrupts the line from toe to heel. In black it disappears under a trouser hem; in oxblood it is the one colour in the room; in ivory suede it softens a dark suit." },
      { type: "figure", src: "/media/products/nocturne-low/black-calf-alt.webp", alt: "Nocturne Low in black calf, seen from the heel", caption: "Nocturne Low in black calf. The calf is burnished by hand, so the colour deepens at the toe and heel with wear." },
      { type: "p", text: "Around it, the rest of the chapter was built to be worn together: a loafer and a derby for evenings that turn formal, a heavyweight tee and a brushed wool overshirt for the ones that don't, and a tote that holds a laptop by day and everything else by night." },
      { type: "quote", text: "We wanted pieces you reach for at seven in the evening, not seven in the morning." },
      { type: "h2", text: "Made to last past the season" },
      { type: "p", text: "A collection about one hour of the day should still make sense in five years. So the soles are stitched rather than glued, the leathers are chosen to age rather than crack, and every colour is offered again in the next chapter instead of being retired." },
      { type: "products", title: "From Chapter I", slugs: ["nocturne-low", "vesper-loafer", "midnight-overshirt", "night-tote"] },
    ],
  },
  {
    slug: "eight-stitches-to-the-inch",
    kicker: "Atelier",
    title: "Eight stitches to the inch",
    excerpt: "Why we stitch our soles instead of gluing them, and what that means the day yours wears through.",
    publishedAt: "2026-09-12",
    cover: { src: "/media/journal/stitches.webp", alt: "Hour Derby in espresso calf, showing the welt and stitching" },
    body: [
      { type: "p", text: "Most sneakers are glued together. It is fast and clean, and when the sole wears through, the shoe is finished. We stitch ours instead, at eight stitches to the inch, in a waxed thread matched by hand to each colourway." },
      { type: "h2", text: "What a stitch does" },
      { type: "p", text: "A stitched sole is held on by thread, not adhesive. When it wears down, a cobbler can cut the thread, lift the old sole away and stitch on a new one, so the upper, the part that has moulded to your foot, carries on." },
      { type: "figure", src: "/media/products/hour-derby/espresso-calf-alt.webp", alt: "Hour Derby in espresso calf, three-quarter view from behind", caption: "The Hour Derby's welt joins upper and sole in one visible line of stitching." },
      { type: "p", text: "Eight stitches to the inch is a balance. Fewer, and the seam loosens under flex. More, and the needle perforates the leather so closely that it can tear along the line. Waxed thread swells slightly as it settles, sealing each hole against water." },
      { type: "quote", text: "The best compliment a cobbler can pay a shoe is that it is worth resoling." },
      { type: "h2", text: "Where you'll find it" },
      { type: "p", text: "The Nocturne Low uses a stitched natural‑rubber cupsole. The Hour Derby uses a Goodyear‑style welt, the most repairable construction there is. The Vesper Loafer's apron is sewn by hand with two needles, the slowest step in making the shoe and the one that gives the toe its shape." },
      { type: "products", title: "Stitched, not glued", slugs: ["nocturne-low", "hour-derby", "vesper-loafer"] },
    ],
  },
  {
    slug: "caring-for-calf",
    kicker: "Care",
    title: "A short guide to caring for calf",
    excerpt: "Five minutes a month keeps burnished leather looking better at year five than on day one.",
    publishedAt: "2026-08-20",
    cover: { src: "/media/journal/care.webp", alt: "Night Tote in black calf, seen from above" },
    body: [
      { type: "p", text: "Full‑grain calf is skin, and like skin it wants to be kept clean and supple. It does not need much: a cloth, a cream, a brush and a few minutes once a month." },
      { type: "h2", text: "After every wear" },
      { type: "p", text: "Wipe away dust with a soft, dry cloth. Dust is abrasive, and left in the creases it slowly dulls the finish. For shoes, put cedar shoe trees in while the leather is still warm; they draw out moisture and hold the shape as it dries." },
      { type: "h2", text: "Once a month" },
      { type: "p", text: "Work a small amount of neutral cream into the leather with a cloth, in small circles, then leave it for ten minutes and buff with a horsehair brush. Neutral is the safe choice for every colour; a tinted cream will slowly shift the tone of a burnished finish." },
      { type: "figure", src: "/media/products/calf-card-holder/oxblood-black-front.webp", alt: "Calf Card Holder in oxblood with a black painted edge", caption: "Painted edges need nothing but a dry cloth. Keep cream away from them." },
      { type: "h2", text: "What to avoid" },
      { type: "p", text: "Direct heat, such as a radiator or a hair dryer, dries leather out and can crack it. If a piece gets soaked, stuff it with paper and let it dry slowly at room temperature. Avoid alcohol‑based cleaners and household wipes entirely." },
      { type: "p", text: "Suede is the exception to all of this: never use cream or water on it. Brush it in one direction with a suede brush, and lift marks with a suede eraser." },
      { type: "products", title: "In full-grain calf", slugs: ["night-tote", "calf-card-holder", "hour-derby"] },
    ],
  },
  {
    slug: "the-house",
    kicker: "The house",
    title: "A house for the after-hours",
    excerpt: "VESPER makes a small number of things, for the hours after work, built to be worn for years.",
    publishedAt: "2026-07-01",
    cover: { src: "/media/journal/the-house.webp", alt: "Vesper Loafer in oxblood calf, side profile" },
    body: [
      { type: "p", text: "Vesper is the old word for evening. The house takes its name, and its brief, from that hour: the part of the day that belongs to you, after the work is done and before the night begins." },
      { type: "p", text: "We make a small number of things. Footwear first, then the pieces worn with it: heavyweight tees, outerwear in waxed cotton and wool, and leather goods. Each collection is a chapter, and each chapter adds to the one before rather than replacing it." },
      { type: "h2", text: "Fewer pieces, made properly" },
      { type: "p", text: "We would rather make one sneaker well than ten adequately. That means full‑grain leathers that age rather than crack, soles that can be replaced, and colours we keep offering long after their first season." },
      { type: "quote", text: "Made for the hour when the city turns gold, then black." },
      { type: "h2", text: "See it before you buy it" },
      { type: "p", text: "Every piece on this site can be turned, zoomed and examined in 3D, down to the stitching and the edge paint. It is the closest we can get, online, to putting a shoe in your hand in the atelier." },
      { type: "products", title: "Where to start", slugs: ["nocturne-low", "heavyweight-tee", "field-jacket"] },
    ],
  },
];

export const getArticle = (slug: string) => ARTICLES.find((a) => a.slug === slug) ?? null;

/** Newest first. */
export const listArticles = () => [...ARTICLES].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

/** Rough reading time at 220 words per minute. */
export function readingMinutes(a: Article) {
  const words = a.body.reduce((n, b) => n + ("text" in b ? b.text.split(/\s+/).length : 0), 0);
  return Math.max(1, Math.ceil(words / 220));
}
