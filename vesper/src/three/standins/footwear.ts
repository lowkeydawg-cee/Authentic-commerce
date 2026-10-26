import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { makeMaterial, type Finish } from "./materials";
import { closedTube, offsetOutline, openTube, sampleClosed, shapeFrom, smoothstep } from "./shapes";

/**
 * STAND-IN footwear, built procedurally until the Blender GLB models exist.
 * Part names match the production model spec (upper, lining, laces, sole,
 * heel_tab, logo) and hotspot anchors are exported as named empties
 * (HS_material, HS_stitch, HS_sole, HS_logo) exactly as the GLBs will be.
 */
export type FootwearStyle = "low" | "high" | "trainer" | "loafer" | "derby";

export interface FootwearFinishes {
  upper: Finish;
  sole: Finish;
  midsole?: Finish;
  lining: Finish;
  laces?: Finish;
  thread: Finish;
  logo?: Finish;
}

interface StyleSpec {
  soleH: number;
  outsoleH: number;
  upperH: number;
  /** Upper height multiplier along the length, t = 0 heel → 1 toe. */
  profile: (t: number) => number;
  taper: number;
  spring: number;
  collar: { x: number; sx: number; sz: number };
  laces: number;
  tongue: boolean;
  apron: boolean;
  heelBlock: boolean;
}

const STYLES: Record<FootwearStyle, StyleSpec> = {
  low: {
    soleH: 0.075, outsoleH: 0, upperH: 0.27, taper: 0.4, spring: 0.03,
    profile: (t) => 1 - 0.55 * smoothstep(0.18, 0.88, t),
    collar: { x: -0.22, sx: 0.17, sz: 0.095 }, laces: 5, tongue: true, apron: false, heelBlock: false,
  },
  high: {
    soleH: 0.08, outsoleH: 0, upperH: 0.48, taper: 0.46, spring: 0.03,
    profile: (t) => 1 - 0.74 * smoothstep(0.1, 0.78, t),
    collar: { x: -0.27, sx: 0.14, sz: 0.085 }, laces: 7, tongue: true, apron: false, heelBlock: false,
  },
  trainer: {
    soleH: 0.11, outsoleH: 0.03, upperH: 0.24, taper: 0.4, spring: 0.045,
    profile: (t) => 1 - 0.52 * smoothstep(0.2, 0.9, t),
    collar: { x: -0.22, sx: 0.17, sz: 0.095 }, laces: 5, tongue: true, apron: false, heelBlock: false,
  },
  loafer: {
    soleH: 0.03, outsoleH: 0, upperH: 0.21, taper: 0.34, spring: 0.02,
    profile: (t) => 1 - 0.45 * smoothstep(0.28, 0.95, t),
    collar: { x: -0.14, sx: 0.26, sz: 0.1 }, laces: 0, tongue: false, apron: true, heelBlock: true,
  },
  derby: {
    soleH: 0.035, outsoleH: 0, upperH: 0.23, taper: 0.36, spring: 0.025,
    profile: (t) => 1 - 0.5 * smoothstep(0.25, 0.95, t),
    collar: { x: -0.2, sx: 0.18, sz: 0.095 }, laces: 4, tongue: true, apron: false, heelBlock: true,
  },
};

/** Plan-view foot outline, heel at x = -0.5, toe at x = +0.5, width along y. */
const OUTLINE = sampleClosed(
  [
    [0.5, 0], [0.47, 0.1], [0.38, 0.172], [0.22, 0.192], [0.05, 0.165], [-0.12, 0.148], [-0.3, 0.152],
    [-0.42, 0.138], [-0.49, 0.08], [-0.505, 0], [-0.49, -0.08], [-0.42, -0.14], [-0.3, -0.152],
    [-0.12, -0.158], [0.05, -0.172], [0.22, -0.188], [0.38, -0.168], [0.47, -0.1],
  ],
  160,
);

function extrudeUp(points: THREE.Vector2[], depth: number, bevel: number, bevelSize: number, segments: number) {
  const geo = new THREE.ExtrudeGeometry(shapeFrom(points), {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize,
    bevelSegments: segments,
    curveSegments: 64,
    steps: Math.max(2, Math.ceil(depth / 0.015)),
  });
  geo.rotateX(-Math.PI / 2); // extrusion → +Y, outline y → -Z
  geo.translate(0, bevel, 0);
  return geo;
}

export function buildFootwear(style: FootwearStyle, f: FootwearFinishes): THREE.Group {
  const s = STYLES[style];
  const group = new THREE.Group();
  group.name = `standin_footwear_${style}`;
  const lift = (x: number) => s.spring * smoothstep(0.55, 1, x + 0.5) ** 2;
  const springGeo = (input: THREE.BufferGeometry) => {
    // Weld the extrusion's split vertices so lighting is smooth, not faceted.
    input.deleteAttribute("normal");
    const geo = mergeVertices(input, 1e-5);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + lift(p.getX(i)));
    geo.computeVertexNormals();
    return geo;
  };

  // Sole (outsole + midsole for the trainer)
  let soleTop = 0;
  if (s.outsoleH > 0) {
    const out = springGeo(extrudeUp(OUTLINE, s.outsoleH - 0.012, 0.006, 0.006, 3));
    group.add(named(new THREE.Mesh(out, makeMaterial(f.sole)), "outsole"));
    soleTop = s.outsoleH;
  }
  const midH = s.soleH - soleTop;
  const sole = extrudeUp(OUTLINE, midH - 0.02, 0.01, 0.01, 4);
  sole.translate(0, soleTop, 0);
  group.add(named(new THREE.Mesh(springGeo(sole), makeMaterial(f.midsole ?? f.sole)), "sole"));
  soleTop = s.soleH;

  if (s.heelBlock) {
    const block = new RoundedBoxGeometry(0.2, 0.035, 0.26, 3, 0.01);
    block.translate(-0.39, -0.012, 0);
    group.add(named(new THREE.Mesh(block, makeMaterial(f.sole)), "heel_block"));
    group.position.y = 0.03;
  }

  // Upper: rounded pillow of the outline, shaped by the style profile.
  const upperPts = OUTLINE.map((p) => p.clone().multiplyScalar(0.955));
  const bevel = Math.min(0.1, s.upperH * 0.4);
  const upper = extrudeUp(upperPts, Math.max(0.01, s.upperH - bevel * 2), bevel, 0.045, 12);
  const pos = upper.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const rel = y / s.upperH;
    const t = THREE.MathUtils.clamp(x + 0.5, 0, 1);
    pos.setXYZ(i, x, soleTop - 0.012 + y * s.profile(t), z * (1 - s.taper * rel * rel));
  }
  const upperMesh = named(new THREE.Mesh(springGeo(upper), makeMaterial(f.upper)), "upper");
  group.add(upperMesh);

  /**
   * Point on the upper's surface: x along the shoe, theta around it
   * (0 = lateral side, PI/2 = top, PI = medial side), lifted off by `offset`.
   */
  const raycaster = new THREE.Raycaster();
  upperMesh.material.side = THREE.DoubleSide;
  const surf = (x: number, theta: number, offset = 0.004) => {
    const origin = new THREE.Vector3(x, soleTop + 0.03 + lift(x), 0);
    raycaster.set(origin, new THREE.Vector3(0, Math.sin(theta), Math.cos(theta)));
    const hit = raycaster.intersectObject(upperMesh, false)[0];
    if (!hit || !hit.face) return origin;
    return hit.point.clone().add(hit.face.normal.clone().multiplyScalar(offset));
  };
  const seam = (pts: THREE.Vector3[], name: string, radius = 0.0032, finish = f.thread) =>
    group.add(named(new THREE.Mesh(openTube(pts, radius), makeMaterial(finish)), name));
  const range = (n: number, fn: (u: number) => THREE.Vector3) => Array.from({ length: n + 1 }, (_, i) => fn(i / n));

  const topAt = (x: number) => soleTop - 0.012 + s.upperH * s.profile(THREE.MathUtils.clamp(x + 0.5, 0, 1)) + lift(x);
  const slopeAt = (x: number) => Math.atan2(topAt(x + 0.01) - topAt(x - 0.01), 0.02);

  // Collar opening (lining) and padded collar rim
  const opening = new THREE.SphereGeometry(1, 48, 24);
  opening.scale(s.collar.sx, 0.04, s.collar.sz);
  const openingMesh = named(new THREE.Mesh(opening, makeMaterial(f.lining)), "lining");
  openingMesh.position.set(s.collar.x, topAt(s.collar.x) - 0.022, 0);
  openingMesh.rotation.z = slopeAt(s.collar.x);
  group.add(openingMesh);
  const rim = new THREE.TorusGeometry(1, 0.11, 16, 96);
  rim.rotateX(Math.PI / 2);
  rim.scale(s.collar.sx * 1.04, 0.14, s.collar.sz * 1.08);
  const rimMesh = named(new THREE.Mesh(rim, makeMaterial(f.upper)), "collar");
  rimMesh.position.copy(openingMesh.position).add(new THREE.Vector3(0, 0.006, 0));
  rimMesh.rotation.z = openingMesh.rotation.z;
  group.add(rimMesh);

  // Tongue + laces
  const laceStart = s.collar.x + s.collar.sx * 0.95;
  if (s.tongue) {
    const len = 0.06 + s.laces * 0.048;
    const tongue = new RoundedBoxGeometry(len, 0.02, 0.1, 3, 0.009);
    const m = named(new THREE.Mesh(tongue, makeMaterial(f.upper)), "tongue");
    const cx = laceStart + len / 2 - 0.02;
    m.position.set(cx, topAt(cx) + 0.012, 0);
    m.rotation.z = slopeAt(cx);
    group.add(m);
  }
  const laceGap = 0.048;
  const laceEnd = laceStart + 0.02 + (s.laces - 1) * laceGap;
  if (s.laces > 0) {
    // Eyestays either side of the lacing, each with a stitch line
    for (const side of [-1, 1]) {
      seam(range(24, (u) => surf(laceStart - 0.02 + u * (laceEnd - laceStart + 0.06), Math.PI / 2 + side * 0.42, 0.006)), "eyestay", 0.011, { ...f.upper, color: shade(f.upper.color, -0.04) });
      seam(range(24, (u) => surf(laceStart - 0.02 + u * (laceEnd - laceStart + 0.06), Math.PI / 2 + side * 0.56)), "stitch_eyestay");
    }
    for (let i = 0; i < s.laces; i++) {
      const x = laceStart + 0.02 + i * laceGap;
      const skew = (i % 2 ? 1 : -1) * 0.012;
      const a = surf(x - skew, Math.PI / 2 - 0.4, 0.016);
      const b = surf(x + skew, Math.PI / 2 + 0.4, 0.016);
      const mid = a.clone().add(b).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.012, 0));
      seam([a, mid, b], "laces", 0.0078, f.laces ?? f.thread);
    }
  }

  // Panel seams: toe cap and quarter panels (footwear with laces)
  if (!s.apron) {
    seam(range(40, (u) => { const th = 0.14 + u * (Math.PI - 0.28); return surf(0.27 + 0.045 * Math.sin(th), th); }), "stitch_toecap");
    for (const side of [0, 1]) {
      seam(range(30, (u) => {
        const th = Math.PI / 2 + (side ? 1 : -1) * (0.5 + u * 1.0);
        return surf(laceStart - 0.03 - u * 0.12 + 0.03 * Math.sin(u * Math.PI), th);
      }), "stitch_quarter");
    }
  }

  // Loafer apron seam + penny strap
  if (s.apron) {
    const pts = Array.from({ length: 96 }, (_, i) => {
      const a = (i / 96) * Math.PI * 2;
      return surf(0.24 + Math.cos(a) * 0.15, Math.PI / 2 + Math.sin(a) * 0.62);
    });
    group.add(named(new THREE.Mesh(closedTube(pts, 0.0035), makeMaterial(f.thread)), "stitch_apron"));
    const strap = new RoundedBoxGeometry(0.05, 0.012, 0.25, 3, 0.005);
    const m = named(new THREE.Mesh(strap, makeMaterial(f.upper)), "penny_strap");
    m.position.set(0.06, topAt(0.06) + 0.004, 0);
    m.rotation.z = slopeAt(0.06);
    group.add(m);
  }

  // Stitch lines: welt on the sole edge and the upper's base seam
  const weltY = soleTop - (s.soleH - (s.outsoleH || 0)) * 0.45;
  group.add(named(new THREE.Mesh(closedTube(offsetOutline(OUTLINE, 0.011).map((p) => new THREE.Vector3(p.x, weltY + lift(p.x), -p.y)), 0.0032), makeMaterial(f.thread)), "stitch_welt"));
  const seamY = soleTop + 0.022;
  group.add(named(new THREE.Mesh(closedTube(offsetOutline(upperPts, 0.026).map((p) => new THREE.Vector3(p.x, seamY + lift(p.x), -p.y)), 0.003), makeMaterial(f.thread)), "stitch_upper"));

  // Heel tab
  const tabH = Math.min(0.1, s.upperH * 0.65);
  const tab = new RoundedBoxGeometry(0.02, tabH, 0.07, 3, 0.008);
  const tabMesh = named(new THREE.Mesh(tab, makeMaterial(f.logo ?? f.upper)), "heel_tab");
  tabMesh.position.set(-0.505, soleTop + s.upperH * 0.55, 0);
  group.add(tabMesh);

  // Debossed V on the lateral side
  const v = new THREE.Shape();
  v.moveTo(-0.025, 0.03); v.lineTo(-0.015, 0.03); v.lineTo(0, -0.005); v.lineTo(0.015, 0.03);
  v.lineTo(0.025, 0.03); v.lineTo(0.004, -0.03); v.lineTo(-0.004, -0.03); v.closePath();
  const vGeo = new THREE.ExtrudeGeometry(v, { depth: 0.002, bevelEnabled: false });
  vGeo.scale(0.7, 0.7, 1);
  const logoX = -0.3;
  const vMesh = named(new THREE.Mesh(vGeo, makeMaterial(f.logo ?? { ...f.upper, color: shade(f.upper.color, -0.05) })), "logo");
  const logoTheta = 0.32;
  vMesh.position.copy(surf(logoX, logoTheta, 0.001));
  vMesh.lookAt(vMesh.position.clone().add(new THREE.Vector3(0, Math.sin(logoTheta), Math.cos(logoTheta))));
  group.add(vMesh);

  // Hotspot anchors (named empties, like the production GLB)
  const anchors: [string, THREE.Vector3][] = [
    ["HS_material", surf(0.12, 1.0, 0.01)],
    ["HS_stitch", surf(0.3, 0.7, 0.01)],
    ["HS_sole", new THREE.Vector3(0.3, weltY, 0.18)],
    ["HS_logo", vMesh.position.clone()],
  ];
  for (const [name, p] of anchors) {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.copy(p);
    group.add(o);
  }

  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return group;
}

function named<T extends THREE.Object3D>(o: T, name: string): T {
  o.name = name;
  return o;
}

function shade(hex: string, amount: number) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amount);
  return `#${c.getHexString()}`;
}
