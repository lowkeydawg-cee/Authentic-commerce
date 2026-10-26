/**
 * SAMPLE product content (details, care, fit, construction highlights).
 * In production this is editorial content from the CMS, keyed by product.
 */
import type { Highlight, ProductContent } from "./types";

const hl = (id: string, anchor: string, kicker: string, title: string, body: string): Highlight => ({ id, anchor, kicker, title, body });

const SNEAKER_CARE = ["Wipe with a soft, dry cloth after wear.", "Condition the leather monthly with a neutral cream.", "Store with cedar shoe trees, away from direct heat."];
const SUEDE_CARE = ["Brush with a suede brush in one direction.", "Treat with a water repellent before first wear.", "Remove marks with a suede eraser; never use water."];
const SHOE_CARE = ["Polish with a neutral wax cream every few wears.", "Rest for a day between wears, with shoe trees.", "Resole with any skilled cobbler when the sole wears."];
const JERSEY_CARE = ["Machine wash cold, inside out, with similar colours.", "Dry flat in the shade to keep the shape.", "Iron on low on the reverse."];
const LEATHER_GOODS_CARE = ["Wipe with a dry cloth; avoid water and alcohol.", "Condition twice a year with a neutral cream.", "Store in the dust bag provided."];

export const CONTENT: Record<string, ProductContent> = {
  "nocturne-low": {
    fit: "Runs true to size. Between sizes? Choose the smaller — the calf softens and moulds with wear.",
    details: ["Low‑top silhouette with a tapered toe", "Padded collar, calf lining", "Waxed cotton laces, two spare pairs included", "Made in Italy"],
    care: SNEAKER_CARE,
    highlights: [
      hl("material", "HS_material", "Material", "Hand‑burnished calf", "Full‑grain calf, burnished by hand so the colour deepens at the toe and heel over time."),
      hl("stitch", "HS_stitch", "Stitching", "Tonal waxed thread", "Eight stitches to the inch in waxed thread, matched to each colourway."),
      hl("sole", "HS_sole", "Sole", "Stitched cupsole", "A natural rubber cupsole stitched to the upper rather than glued, so it can be resoled."),
      hl("logo", "HS_logo", "Logo", "Debossed V", "A blind‑debossed V on the lateral quarter. No printed branding."),
    ],
  },
  "meridian-trainer": {
    fit: "Runs true to size with a roomier toe box. Narrow feet may prefer half a size down.",
    details: ["Brushed suede upper", "Two‑layer sole: cushioned midsole, rubber outsole", "Removable cushioned insole", "Made in Portugal"],
    care: SUEDE_CARE,
    highlights: [
      hl("material", "HS_material", "Material", "Brushed suede", "A dense, short‑nap suede that keeps its colour and softens without stretching."),
      hl("stitch", "HS_stitch", "Stitching", "Reinforced toe cap", "A double‑stitched toe cap protects the most worn part of the shoe."),
      hl("sole", "HS_sole", "Sole", "Two‑layer construction", "A cushioned midsole for long evenings, over a hard‑wearing rubber outsole."),
      hl("logo", "HS_logo", "Logo", "Debossed V", "A tonal V pressed into the suede on the outer side."),
    ],
  },
  "vesper-loafer": {
    fit: "Slim through the heel. If you are between sizes, choose the larger.",
    details: ["Hand‑stitched apron and penny strap", "Stacked heel with rubber top‑piece", "Calf lining and footbed", "Made in Italy"],
    care: SHOE_CARE,
    highlights: [
      hl("material", "HS_material", "Material", "Burnished calf", "Burnished by hand for a deep, uneven shine that develops with every wear."),
      hl("stitch", "HS_stitch", "Stitching", "Hand‑sewn apron", "The apron seam is sewn by hand with two needles, the slowest step in making the shoe."),
      hl("sole", "HS_sole", "Sole", "Slim rubber sole", "A thin rubber sole for grip on city pavements, stitched for resoling."),
      hl("logo", "HS_logo", "Logo", "Debossed V", "A small blind‑debossed V on the outer quarter."),
    ],
  },
  "hour-derby": {
    fit: "True to size with a standard width. Wear with a thin sock for the closest fit.",
    details: ["Open‑laced derby pattern", "Stitched welt, leather heel", "Calf lining", "Made in Spain"],
    care: SHOE_CARE,
    highlights: [
      hl("material", "HS_material", "Material", "Smooth calf", "A smooth, close‑grained calf that takes a high shine when polished."),
      hl("stitch", "HS_stitch", "Stitching", "Toe cap seam", "A single line of fine stitching defines the toe without a heavy cap."),
      hl("sole", "HS_sole", "Sole", "Stitched welt", "The welt is stitched through, so the sole can be replaced again and again."),
      hl("logo", "HS_logo", "Logo", "Debossed V", "A discreet V pressed into the outer quarter."),
    ],
  },
  "heavyweight-tee": {
    fit: "Relaxed through the body with a close collar. Take your usual size; size down for a neater fit.",
    details: ["300 g/m² organic cotton jersey", "Close rib collar", "Twin‑needle hems", "Made in Portugal"],
    care: JERSEY_CARE,
    highlights: [
      hl("material", "HS_material", "Material", "Heavyweight jersey", "A dense 300 g organic cotton jersey that holds its shape wash after wash."),
      hl("collar", "HS_collar", "Collar", "Close rib collar", "A narrow rib collar, bound inside so it lies flat and doesn't stretch."),
      hl("stitch", "HS_stitch", "Stitching", "Twin‑needle hems", "Two parallel rows of stitching at every hem for durability."),
      hl("logo", "HS_logo", "Detail", "No visible branding", "A woven V label sits inside the back neck only."),
    ],
  },
  "after-hours-long-sleeve": {
    fit: "Regular fit, cut slightly longer at the back. Take your usual size.",
    details: ["Brushed organic cotton jersey", "Longer back hem", "Rib cuffs and collar", "Made in Portugal"],
    care: JERSEY_CARE,
    highlights: [
      hl("material", "HS_material", "Material", "Brushed jersey", "Brushed on the inside for warmth without weight."),
      hl("collar", "HS_collar", "Collar", "Rib collar", "A soft rib collar that keeps its shape."),
      hl("stitch", "HS_stitch", "Stitching", "Curved back hem", "The back hem is cut longer and curved to sit well when tucked or untucked."),
      hl("logo", "HS_logo", "Detail", "No visible branding", "A woven V label inside the back neck only."),
    ],
  },
  "field-jacket": {
    fit: "Cut with room for a knit underneath. Take your usual size.",
    details: ["Waxed organic cotton shell", "Calf‑trimmed collar", "Four pockets, horn buttons", "Made in England"],
    care: ["Spot clean only; do not wash or dry clean.", "Re‑proof with wax dressing once a year.", "Hang to dry at room temperature, away from heat."],
    highlights: [
      hl("material", "HS_material", "Material", "Waxed cotton", "A dense cotton cloth impregnated with wax for rain resistance. It develops a patina over time."),
      hl("collar", "HS_collar", "Collar", "Calf‑trimmed collar", "The collar is faced in calf leather, so it softens with wear."),
      hl("stitch", "HS_stitch", "Stitching", "Felled seams", "Every seam is felled and double‑stitched to keep weather out."),
      hl("logo", "HS_logo", "Detail", "Horn buttons", "Natural horn buttons, each one slightly different."),
    ],
  },
  "midnight-overshirt": {
    fit: "A relaxed shirt‑jacket fit. Size down for a closer fit over a tee.",
    details: ["Brushed wool", "Two flap chest pockets", "Calf‑trimmed collar", "Made in Italy"],
    care: ["Dry clean only.", "Brush gently after wear to lift the nap.", "Store on a wide hanger."],
    highlights: [
      hl("material", "HS_material", "Material", "Brushed wool", "A soft, lightly brushed wool with a fine, cloudy texture."),
      hl("collar", "HS_collar", "Collar", "Calf‑faced collar", "A calf facing under the collar keeps its shape."),
      hl("stitch", "HS_stitch", "Stitching", "Clean hem", "The hem is finished with a single discreet line of stitching."),
      hl("logo", "HS_logo", "Detail", "Flap pockets", "Two chest pockets with flaps, set on a slight angle."),
    ],
  },
  "calf-card-holder": {
    fit: "Holds four to six cards and folded notes. 10.5 × 7 cm.",
    details: ["Four card slots and a centre pocket", "Hand‑painted edges", "Calf lining", "Made in Italy"],
    care: LEATHER_GOODS_CARE,
    highlights: [
      hl("material", "HS_material", "Material", "Smooth calf", "A firm, smooth calf that keeps its shape when full."),
      hl("edge", "HS_edge", "Edges", "Hand‑painted edges", "Each edge is sanded and painted by hand in several thin coats."),
      hl("stitch", "HS_stitch", "Stitching", "Saddle stitching", "Stitched with waxed linen thread, close to the edge."),
      hl("logo", "HS_logo", "Logo", "Debossed V", "A blind‑debossed V on the front pocket."),
    ],
  },
  "night-tote": {
    fit: "Fits a 14″ laptop. 38 × 30 × 12 cm; handle drop 18 cm.",
    details: ["Calf leather body", "Suede lining with inner pocket", "Rolled handles", "Made in Italy"],
    care: LEATHER_GOODS_CARE,
    highlights: [
      hl("material", "HS_material", "Material", "Soft calf", "A supple calf that holds a soft structure without a stiffener."),
      hl("handles", "HS_handles", "Handles", "Rolled handles", "Each handle is rolled around a cord core and stitched by hand."),
      hl("lining", "HS_lining", "Lining", "Suede lining", "Lined in suede, with an inner zip pocket."),
      hl("stitch", "HS_stitch", "Stitching", "Framed seams", "A stitched frame on each face keeps the shape crisp."),
    ],
  },
};
