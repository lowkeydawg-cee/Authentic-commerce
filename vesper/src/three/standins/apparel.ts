import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { makeMaterial, type Finish } from "./materials";
import { closedTube, offsetOutline, openTube, pillow, sampleClosed } from "./shapes";

/**
 * STAND-IN apparel: soft studio flat-lays built from garment silhouettes.
 * Replaced by scanned / Blender garments (with the same part names) later.
 */
export type GarmentStyle = "tee" | "longsleeve" | "jacket";

export interface GarmentFinishes {
  body: Finish;
  thread: Finish;
  trim?: Finish; // collar rib, buttons, pocket flaps
}

type P = [number, number];
const mirror = (half: P[]): P[] => [...half, ...half.slice().reverse().map(([x, y]) => [-x, y] as P)];

/** Right half of each silhouette, from centre-neck clockwise to centre-hem. */
const SILHOUETTES: Record<GarmentStyle, P[]> = {
  tee: [
    [0, 0.445], [0.07, 0.455], [0.125, 0.5], [0.3, 0.465], [0.49, 0.3], [0.495, 0.29],
    [0.415, 0.16], [0.405, 0.155], [0.31, 0.215], [0.315, -0.47], [0.31, -0.5], [0, -0.505],
  ],
  longsleeve: [
    [0, 0.445], [0.07, 0.455], [0.125, 0.5], [0.3, 0.465], [0.585, -0.13], [0.585, -0.145],
    [0.49, -0.18], [0.48, -0.175], [0.31, 0.2], [0.315, -0.47], [0.31, -0.5], [0, -0.505],
  ],
  jacket: [
    [0, 0.42], [0.09, 0.47], [0.15, 0.52], [0.36, 0.48], [0.63, -0.25], [0.63, -0.265],
    [0.52, -0.3], [0.51, -0.295], [0.35, 0.18], [0.37, -0.62], [0.36, -0.65], [0, -0.655],
  ],
};

export function buildGarment(style: GarmentStyle, f: GarmentFinishes): THREE.Group {
  const group = new THREE.Group();
  group.name = `standin_garment_${style}`;
  const outline = sampleClosed(mirror(SILHOUETTES[style]), 240);
  const thickness = style === "jacket" ? 0.07 : 0.045;

  // Body: pillowed silhouette with soft fabric folds on the top face.
  const raw = pillow(outline, thickness, thickness * 0.45);
  raw.deleteAttribute("normal");
  const body = mergeVertices(raw, 1e-5);
  const pos = body.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (z > 0) {
      const fold = 0.011 * Math.sin(5.5 * x + 2.2 * y) + 0.007 * Math.sin(10 * y - 3 * x + 1.3) + 0.004 * Math.sin(17 * x);
      pos.setZ(i, z + fold * (z / (thickness / 2)));
    }
  }
  body.computeVertexNormals();
  const top = thickness / 2 + 0.006;
  group.add(named(new THREE.Mesh(body, makeMaterial(f.body)), "body"));

  const thread = makeMaterial(f.thread);
  const stitch = (pts: THREE.Vector3[], name: string, closed = false) =>
    group.add(named(new THREE.Mesh(closed ? closedTube(pts, 0.0028) : openTube(pts, 0.0028), thread), name));
  const line = (a: P, b: P, n = 20) => Array.from({ length: n + 1 }, (_, i) => new THREE.Vector3(a[0] + (b[0] - a[0]) * (i / n), a[1] + (b[1] - a[1]) * (i / n), top));

  // Hem stitch, inset from the outline along the bottom edge.
  const hemY = style === "jacket" ? -0.6 : -0.465;
  const halfHem = style === "jacket" ? 0.35 : 0.3;
  stitch(line([-halfHem, hemY], [halfHem, hemY], 40), "stitch_hem");

  // Sleeve hems
  const sil = SILHOUETTES[style];
  const cuffA = sil[4], cuffB = sil[6];
  for (const side of [-1, 1]) {
    const a: P = [side * (cuffA[0] - 0.035), cuffA[1] - 0.005];
    const b: P = [side * (cuffB[0] - 0.02), cuffB[1] + 0.03];
    stitch(line(a, b), "stitch_cuff");
  }

  // Shoulder seams
  for (const side of [-1, 1]) stitch(line([side * 0.13, 0.49], [side * 0.3, 0.455]), "stitch_shoulder");

  if (style === "jacket") {
    const trim = makeMaterial(f.trim ?? f.body);
    // Collar lapels: two soft triangles lying on the chest
    for (const side of [-1, 1]) {
      const lapel = sampleClosed([[side * 0.01, 0.42], [side * 0.14, 0.5], [side * 0.15, 0.44], [side * 0.1, 0.3], [side * 0.025, 0.14]], 80);
      const geo = pillow(lapel, 0.025, 0.01);
      const m = named(new THREE.Mesh(geo, trim), "collar");
      m.position.z = top + 0.005;
      group.add(m);
    }
    // Placket + buttons
    stitch(line([0.012, 0.16], [0.012, -0.64], 40), "stitch_placket");
    for (let i = 0; i < 5; i++) {
      const b = new THREE.CylinderGeometry(0.018, 0.018, 0.01, 32);
      b.rotateX(Math.PI / 2);
      const m = named(new THREE.Mesh(b, trim), "buttons");
      m.position.set(0.04, 0.1 - i * 0.16, top + 0.004);
      group.add(m);
    }
    // Chest pockets with flaps
    for (const side of [-1, 1]) {
      const pocket = sampleClosed([[side * 0.1, 0.08], [side * 0.26, 0.08], [side * 0.26, -0.12], [side * 0.1, -0.12]], 60);
      const m = named(new THREE.Mesh(pillow(pocket, 0.016, 0.006), makeMaterial(f.body)), "pocket");
      m.position.z = top - 0.002;
      group.add(m);
      const flap = sampleClosed([[side * 0.095, 0.1], [side * 0.265, 0.1], [side * 0.265, 0.035], [side * 0.18, 0.02], [side * 0.095, 0.035]], 60);
      const fm = named(new THREE.Mesh(pillow(flap, 0.018, 0.007), trim), "pocket_flap");
      fm.position.z = top + 0.008;
      group.add(fm);
      stitch(offsetOutline(pocket, -0.012).map((p) => new THREE.Vector3(p.x, p.y, top + 0.007)), "stitch_pocket", true);
    }
  } else {
    // Rib collar: soft torus segment hugging the neckline
    const neck = Array.from({ length: 41 }, (_, i) => {
      const a = Math.PI * (i / 40);
      return new THREE.Vector3(Math.cos(a) * 0.125, 0.5 - Math.sin(a) * 0.055 - 0.005, top - 0.008);
    });
    group.add(named(new THREE.Mesh(openTube(neck, 0.014), makeMaterial(f.trim ?? f.body)), "collar"));
    group.add(named(new THREE.Mesh(openTube(neck.map((p) => p.clone().add(new THREE.Vector3(0, -0.022, 0.004))), 0.0026), thread), "stitch_collar"));
  }

  // Hotspot anchors
  const anchors: [string, THREE.Vector3][] = [
    ["HS_material", new THREE.Vector3(-0.12, -0.15, top)],
    ["HS_stitch", new THREE.Vector3(0, hemY, top)],
    ["HS_collar", new THREE.Vector3(0, 0.44, top)],
    ["HS_logo", new THREE.Vector3(0.18, 0.3, top)],
  ];
  for (const [name, p] of anchors) {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.copy(p);
    group.add(o);
  }

  // Lie flat on the studio floor, collar away from camera.
  group.rotation.x = -Math.PI / 2;
  group.position.y = thickness / 2 + 0.01;
  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = o.receiveShadow = true;
  });
  const wrapper = new THREE.Group();
  wrapper.name = group.name;
  wrapper.add(group);
  return wrapper;
}

function named<T extends THREE.Object3D>(o: T, name: string): T {
  o.name = name;
  return o;
}
