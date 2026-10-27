/** Triangle count per catalogue model, for the performance budget. */
import { PRODUCTS } from "../../src/lib/commerce/sample-data";
import { buildStandin, type StandinSpec } from "../../src/three/standins";
import type * as THREE from "three";

export function modelTriangles() {
  return PRODUCTS.map((p) => {
    const g = buildStandin({ kind: p.model.kind, style: p.model.style, finishes: p.colorways[0].finishes } as StandinSpec);
    let tris = 0;
    g.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) tris += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3;
    });
    return { slug: p.slug, kind: p.model.kind, tris: Math.round(tris) };
  });
}
