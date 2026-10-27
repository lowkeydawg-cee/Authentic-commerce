import * as THREE from "three";

export const smoothstep = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Smooth closed outline through control points, resampled evenly. */
export function sampleClosed(points: [number, number][], count: number): THREE.Vector2[] {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, "centripetal");
  return curve.getSpacedPoints(count).slice(0, count).map((p) => new THREE.Vector2(p.x, p.y));
}

export function shapeFrom(points: THREE.Vector2[]): THREE.Shape {
  return new THREE.Shape(points);
}

function signedArea(points: THREE.Vector2[]) {
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i], q = points[(i + 1) % points.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

/** Push a closed outline outward (positive d) along its normals. */
export function offsetOutline(points: THREE.Vector2[], d: number): THREE.Vector2[] {
  const sign = signedArea(points) > 0 ? 1 : -1;
  return points.map((p, i) => {
    const prev = points[(i - 1 + points.length) % points.length];
    const next = points[(i + 1) % points.length];
    const t = next.clone().sub(prev).normalize();
    const n = new THREE.Vector2(t.y, -t.x).multiplyScalar(sign);
    return p.clone().add(n.multiplyScalar(d));
  });
}

/** Half-width of an outline at x on one side (+1: y > 0, -1: y < 0). */
export function widthAt(points: THREE.Vector2[], x: number, side: 1 | -1 = 1): number {
  let best = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    if ((a.x - x) * (b.x - x) > 0 || a.x === b.x) continue;
    const t = (x - a.x) / (b.x - a.x);
    const y = a.y + (b.y - a.y) * t;
    if (Math.sign(y) === side) best = Math.max(best, Math.abs(y));
  }
  return best;
}

export function closedTube(points: THREE.Vector3[], radius: number, segments = 320, radial = 6): THREE.TubeGeometry {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), segments, radius, radial, true);
}

export function openTube(points: THREE.Vector3[], radius: number, segments = 120, radial = 10): THREE.TubeGeometry {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, false), segments, radius, radial, false);
}

/** Soft "pillow" slab from a 2D silhouette, lying in the XY plane, thickness along Z. */
export function pillow(points: THREE.Vector2[], thickness: number, softness: number): THREE.ExtrudeGeometry {
  const geo = new THREE.ExtrudeGeometry(shapeFrom(points), {
    depth: Math.max(0.002, thickness - softness * 2),
    bevelEnabled: true,
    bevelThickness: softness,
    bevelSize: softness * 0.8,
    bevelSegments: 8,
    curveSegments: 48,
  });
  geo.translate(0, 0, -thickness / 2 + softness);
  return geo;
}
