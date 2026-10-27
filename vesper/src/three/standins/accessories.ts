import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { finishMaterial, type Finish, type FinishSet } from "./materials";
import { closedTube, offsetOutline, openTube, pillow, sampleClosed } from "./shapes";

/** STAND-IN accessories, replaced by Blender models with the same part names. */
export type AccessoryStyle = "cardholder" | "tote";

export interface AccessoryFinishes {
  body: Finish;
  thread: Finish;
  lining?: Finish;
  edge?: Finish; // painted edges / handles
}

function roundedRect(w: number, h: number, r: number): THREE.Vector2[] {
  const pts: [number, number][] = [];
  const corners: [number, number, number][] = [
    [w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, Math.PI / 2],
    [-w / 2 + r, -h / 2 + r, Math.PI], [w / 2 - r, -h / 2 + r, (3 * Math.PI) / 2],
  ];
  for (const [cx, cy, start] of corners)
    for (let i = 0; i <= 8; i++) {
      const a = start + (i / 8) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  return pts.map(([x, y]) => new THREE.Vector2(x, y));
}

function smooth(geo: THREE.BufferGeometry) {
  geo.deleteAttribute("normal");
  const merged = mergeVertices(geo, 1e-5);
  merged.computeVertexNormals();
  return merged;
}

export function buildAccessory(style: AccessoryStyle, f: AccessoryFinishes): THREE.Group {
  const group = new THREE.Group();
  group.name = `standin_accessory_${style}`;
  const M = (chain: string[], shade = 0) => finishMaterial(f as unknown as FinishSet, chain, shade);
  const thread = M(["thread"]);

  if (style === "cardholder") {
    const shell = roundedRect(0.62, 0.42, 0.04);
    const body = new THREE.Mesh(smooth(pillow(shell, 0.05, 0.016)), M(["body"]));
    body.name = "body";
    group.add(body);
    // Front pocket layer
    const pocket = roundedRect(0.62, 0.26, 0.04).map((p) => new THREE.Vector2(p.x, p.y - 0.08));
    const pm = new THREE.Mesh(smooth(pillow(pocket, 0.016, 0.006)), M(["body"]));
    pm.name = "pocket";
    pm.position.z = 0.028;
    group.add(pm);
    // Painted edge on the pocket mouth
    const edge = new THREE.Mesh(openTube([new THREE.Vector3(-0.3, 0.05, 0.034), new THREE.Vector3(0, 0.052, 0.035), new THREE.Vector3(0.3, 0.05, 0.034)], 0.006), M(["edge", "body"]));
    edge.name = "edge";
    group.add(edge);
    group.add(Object.assign(new THREE.Mesh(closedTube(offsetOutline(shell, -0.022).map((p) => new THREE.Vector3(p.x, p.y, 0.026)), 0.0026), thread), { name: "stitch" }));
    group.add(Object.assign(new THREE.Mesh(closedTube(offsetOutline(pocket, -0.022).map((p) => new THREE.Vector3(p.x, p.y, 0.038)), 0.0026), thread), { name: "stitch_pocket" }));
    // Debossed V
    const v = new THREE.Shape();
    v.moveTo(-0.025, 0.03); v.lineTo(-0.015, 0.03); v.lineTo(0, -0.005); v.lineTo(0.015, 0.03);
    v.lineTo(0.025, 0.03); v.lineTo(0.004, -0.03); v.lineTo(-0.004, -0.03); v.closePath();
    const logo = new THREE.Mesh(new THREE.ExtrudeGeometry(v, { depth: 0.002, bevelEnabled: false }), M(["body"], -0.06));
    logo.name = "logo";
    logo.position.set(0, -0.09, 0.037);
    group.add(logo);
    anchor(group, "HS_material", new THREE.Vector3(-0.15, 0.13, 0.03));
    anchor(group, "HS_stitch", new THREE.Vector3(0.28, 0.1, 0.03));
    anchor(group, "HS_logo", logo.position.clone());
    anchor(group, "HS_edge", new THREE.Vector3(0.1, 0.05, 0.04));
    group.rotation.x = -Math.PI / 2;
    group.position.y = 0.03;
  }

  if (style === "tote") {
    // Upright soft trapezoid body
    const face = sampleClosed([[-0.4, -0.38], [0, -0.385], [0.4, -0.38], [0.48, 0.38], [0, 0.375], [-0.48, 0.38]], 160);
    const raw = pillow(face, 0.18, 0.05);
    const body = new THREE.Mesh(smooth(raw), M(["body"]));
    body.name = "body";
    group.add(body);
    // Opening with lining
    const mouth = new THREE.SphereGeometry(1, 48, 16);
    mouth.scale(0.44, 0.012, 0.045);
    const lining = new THREE.Mesh(mouth, M(["lining", "body"]));
    lining.name = "lining";
    lining.position.y = 0.385;
    group.add(lining);
    // Handles
    for (const z of [-0.05, 0.05]) {
      const pts = Array.from({ length: 41 }, (_, i) => {
        const a = Math.PI * (i / 40);
        return new THREE.Vector3(Math.cos(a) * 0.17, 0.37 + Math.sin(a) * 0.36, z);
      });
      const h = new THREE.Mesh(openTube(pts, 0.012), M(["edge", "body"]));
      h.name = "handles";
      group.add(h);
    }
    // Front stitch frame + base seam
    const inset = offsetOutline(face, -0.05);
    for (const z of [0.092, -0.092])
      group.add(Object.assign(new THREE.Mesh(closedTube(inset.map((p) => new THREE.Vector3(p.x, p.y, z)), 0.0028), thread), { name: "stitch" }));
    anchor(group, "HS_material", new THREE.Vector3(-0.15, 0.0, 0.13));
    anchor(group, "HS_stitch", new THREE.Vector3(0.3, -0.2, 0.13));
    anchor(group, "HS_handles", new THREE.Vector3(0, 0.66, 0.07));
    anchor(group, "HS_lining", new THREE.Vector3(0, 0.39, 0));
    group.position.y = 0.38 + 0.01;
  }

  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = o.receiveShadow = true;
  });
  const wrapper = new THREE.Group();
  wrapper.name = group.name;
  wrapper.add(group);
  return wrapper;
}

function anchor(group: THREE.Group, name: string, p: THREE.Vector3) {
  const o = new THREE.Object3D();
  o.name = name;
  o.position.copy(p);
  group.add(o);
}

