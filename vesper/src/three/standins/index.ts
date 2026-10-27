import type * as THREE from "three";
import { recolor, type FinishSet } from "./materials";
import { buildAccessory, type AccessoryFinishes, type AccessoryStyle } from "./accessories";
import { buildGarment, type GarmentFinishes, type GarmentStyle } from "./apparel";
import { buildFootwear, type FootwearFinishes, type FootwearStyle } from "./footwear";

/** Serializable description of a stand-in model (lives in product data). */
export type StandinSpec = { framing?: number } & (
  | { kind: "footwear"; style: FootwearStyle; finishes: FootwearFinishes }
  | { kind: "garment"; style: GarmentStyle; finishes: GarmentFinishes }
  | { kind: "accessory"; style: AccessoryStyle; finishes: AccessoryFinishes }
);

function buildFresh(spec: StandinSpec): THREE.Group {
  switch (spec.kind) {
    case "footwear":
      return buildFootwear(spec.style, spec.finishes);
    case "garment":
      return buildGarment(spec.style, spec.finishes);
    case "accessory":
      return buildAccessory(spec.style, spec.finishes);
  }
}

/** Geometry depends only on kind + style, so each shape is built once per session. */
const templates = new Map<string, THREE.Group>();

/**
 * STAND-IN: procedural model used until the product's Blender GLB is delivered.
 * Milestone 9: later calls clone the cached template (geometry is shared, not
 * rebuilt) and only create materials, so a colour change costs a few ms.
 */
export function buildStandin(spec: StandinSpec): THREE.Group {
  const key = `${spec.kind}:${spec.style}`;
  let template = templates.get(key);
  if (!template) {
    template = buildFresh(spec);
    templates.set(key, template);
  }
  const model = template.clone(true);
  recolor(model, spec.finishes as unknown as FinishSet);
  return model;
}

export type { Finish, MaterialId } from "./materials";
