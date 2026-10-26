import type * as THREE from "three";
import { buildAccessory, type AccessoryFinishes, type AccessoryStyle } from "./accessories";
import { buildGarment, type GarmentFinishes, type GarmentStyle } from "./apparel";
import { buildFootwear, type FootwearFinishes, type FootwearStyle } from "./footwear";

/** Serializable description of a stand-in model (lives in product data). */
export type StandinSpec = { framing?: number } & (
  | { kind: "footwear"; style: FootwearStyle; finishes: FootwearFinishes }
  | { kind: "garment"; style: GarmentStyle; finishes: GarmentFinishes }
  | { kind: "accessory"; style: AccessoryStyle; finishes: AccessoryFinishes }
);

/** STAND-IN: procedural model used until the product's Blender GLB is delivered. */
export function buildStandin(spec: StandinSpec): THREE.Group {
  switch (spec.kind) {
    case "footwear":
      return buildFootwear(spec.style, spec.finishes);
    case "garment":
      return buildGarment(spec.style, spec.finishes);
    case "accessory":
      return buildAccessory(spec.style, spec.finishes);
  }
}

export type { Finish, MaterialId } from "./materials";
