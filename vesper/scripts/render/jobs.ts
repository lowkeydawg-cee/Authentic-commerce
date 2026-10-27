/** Builds poster render jobs (front + alt angle per colourway) from the catalogue. */
import { PRODUCTS } from "../../src/lib/commerce/sample-data";
import type { StandinSpec } from "../../src/three/standins";

export const W = 1000;
export const H = 1250;

export function buildJobs() {
  const hero = PRODUCTS.find((p) => p.slug === "nocturne-low")!;
  const heroJobs = [
    {
      // Wide, low hero still for the homepage stage and camera chapters.
      file: "home/hero-nocturne.webp",
      w: 2400,
      h: 1350,
      angle: { azimuth: 0.62, elevation: 0.2 },
      spec: { kind: "footwear", style: "low", finishes: hero.colorways[0].finishes, framing: 2.1 } as StandinSpec,
    },
  ];
  // Wide journal covers (16:10), one product each, at editorial angles.
  const cover = (file: string, slug: string, colorway: string, azimuth: number, elevation: number, framing: number) => {
    const p = PRODUCTS.find((x) => x.slug === slug)!;
    const c = p.colorways.find((x) => x.id === colorway)!;
    return {
      file: `journal/${file}.webp`,
      w: 1800,
      h: 1125,
      angle: { azimuth, elevation },
      spec: { kind: p.model.kind, style: p.model.style, finishes: c.finishes, framing } as StandinSpec,
    };
  };
  const journalJobs = [
    cover("chapter-i", "nocturne-low", "oxblood-calf", -0.75, 0.14, 0.78),
    cover("stitches", "hour-derby", "espresso-calf", 0.4, 0.34, 0.8),
    cover("care", "night-tote", "black", 0.5, 0.5, 1.2),
    cover("the-house", "vesper-loafer", "oxblood-calf", 0, 0.08, 0.8),
  ];
  return [...heroJobs, ...journalJobs, ...PRODUCTS.flatMap((p) =>
    p.colorways.flatMap((c) =>
      (["front", "alt"] as const).map((view) => ({
        file: c.images[view].replace(/^\/media\//, ""),
        w: W,
        h: H,
        angle: p.model.angles[view],
        spec: { kind: p.model.kind, style: p.model.style, finishes: c.finishes, framing: p.model.framing } as StandinSpec,
      })),
    ),
  )];
}
