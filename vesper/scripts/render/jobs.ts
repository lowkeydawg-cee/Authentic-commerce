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
  return [...heroJobs, ...PRODUCTS.flatMap((p) =>
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
