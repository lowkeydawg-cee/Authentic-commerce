import * as THREE from "three";

/**
 * Shared material library (Step 8 · material & colour variants). Colours are
 * parameters on a handful of physical materials, never separate textures.
 * The grain/weave normal maps are generated procedurally for the stand-ins;
 * the Blender models will ship baked KTX2 maps with the same material ids.
 */
export type MaterialId =
  | "calf"
  | "suede"
  | "rubber"
  | "lining"
  | "thread"
  | "cotton"
  | "wool"
  | "waxedCotton"
  | "metal";

export interface Finish {
  material: MaterialId;
  color: string;
}

const noiseCache = new Map<string, THREE.DataTexture>();

/** Tileable normal map from value noise; `weave` adds a cross-hatched textile pattern. */
function normalMap(kind: "grain" | "fuzz" | "weave" | "knit", size = 256): THREE.DataTexture {
  const cached = noiseCache.get(kind);
  if (cached) return cached;

  // Deterministic PRNG so every render is identical.
  let seed = kind.length * 9301 + 49297;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const h = new Float32Array(size * size);
  const octave = (cell: number, amp: number) => {
    const n = size / cell;
    const grid = Array.from({ length: (n + 1) * (n + 1) }, rand);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const gx = x / cell, gy = y / cell;
        const x0 = Math.floor(gx) % n, y0 = Math.floor(gy) % n;
        const x1 = (x0 + 1) % n, y1 = (y0 + 1) % n;
        const fx = gx - Math.floor(gx), fy = gy - Math.floor(gy);
        const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        const v = (a: number, b: number) => grid[b * (n + 1) + a];
        const top = v(x0, y0) * (1 - sx) + v(x1, y0) * sx;
        const bot = v(x0, y1) * (1 - sx) + v(x1, y1) * sx;
        h[y * size + x] += (top * (1 - sy) + bot * sy) * amp;
      }
  };
  if (kind === "grain") { octave(4, 0.6); octave(8, 0.4); octave(32, 0.2); }
  if (kind === "fuzz") { octave(2, 0.8); octave(4, 0.4); }
  if (kind === "weave" || kind === "knit") {
    octave(4, 0.15);
    const period = kind === "weave" ? 4 : 8;
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const a = Math.sin((x / period) * Math.PI) ** 2;
        const b = Math.sin((y / period) * Math.PI) ** 2;
        h[y * size + x] += kind === "weave" ? ((Math.floor(x / period) + Math.floor(y / period)) % 2 ? a : b) * 0.6 : a * b * 0.8;
      }
  }

  const data = new Uint8Array(size * size * 4);
  const strength = kind === "fuzz" ? 1.2 : 2.2;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const at = (xx: number, yy: number) => h[((yy + size) % size) * size + ((xx + size) % size)];
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const n = new THREE.Vector3(-dx, -dy, 1).normalize();
      const i = (y * size + x) * 4;
      data[i] = (n.x * 0.5 + 0.5) * 255;
      data[i + 1] = (n.y * 0.5 + 0.5) * 255;
      data[i + 2] = (n.z * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  // Mipmaps + anisotropy stop fine weaves from shimmering into moiré.
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  noiseCache.set(kind, tex);
  return tex;
}

function withMap(kind: Parameters<typeof normalMap>[0], repeat: number, scale: number) {
  const map = normalMap(kind).clone();
  map.repeat.set(repeat, repeat);
  map.needsUpdate = true;
  return { normalMap: map, normalScale: new THREE.Vector2(scale, scale) };
}

export function makeMaterial({ material, color }: Finish): THREE.MeshPhysicalMaterial {
  const c = new THREE.Color(color);
  switch (material) {
    case "calf": // hand-burnished: soft sheen, light clearcoat
      return new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.35, ...withMap("grain", 6, 0.25) });
    case "suede":
      return new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.95, sheen: 1, sheenRoughness: 0.6, sheenColor: c.clone().lerp(new THREE.Color("#ffffff"), 0.35), ...withMap("fuzz", 10, 0.35) });
    case "rubber":
      return new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.78, ...withMap("grain", 12, 0.12) });
    case "lining":
      return new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.7 });
    case "thread":
      return new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.5, sheen: 0.5 });
    case "cotton":
      return new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.94, sheen: 0.35, sheenRoughness: 0.85, sheenColor: c.clone().lerp(new THREE.Color("#ffffff"), 0.15), ...withMap("knit", 9, 0.22) });
    case "wool":
      return new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.96, sheen: 0.8, sheenRoughness: 0.9, sheenColor: c.clone().lerp(new THREE.Color("#ffffff"), 0.25), ...withMap("fuzz", 8, 0.45) });
    case "waxedCotton":
      return new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.55, clearcoat: 0.2, clearcoatRoughness: 0.6, ...withMap("weave", 10, 0.3) });
    case "metal":
      return new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.28, metalness: 1 });
  }
}

/** Any builder's finishes, looked up by part key ("upper", "sole", "thread"…). */
export type FinishSet = Record<string, Finish | undefined>;

interface FinishTag {
  chain: string[];
  shade: number;
  fallbackShade: number;
}

function shadeHex(hex: string, amount: number) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amount);
  return `#${c.getHexString()}`;
}

/**
 * Material for a model part. `chain` lists finish keys in fallback order
 * (e.g. ["laces", "thread"]); the choice is recorded on the material so the
 * model can be recoloured later without rebuilding its geometry.
 */
export function finishMaterial(f: FinishSet, chain: string[], shade = 0, fallbackShade = 0): THREE.MeshPhysicalMaterial {
  const index = chain.findIndex((k) => f[k]);
  const base = f[chain[Math.max(0, index)]]!;
  const amount = index > 0 ? fallbackShade : shade;
  const mat = makeMaterial(amount ? { ...base, color: shadeHex(base.color, amount) } : base);
  mat.userData.finish = { chain, shade, fallbackShade } satisfies FinishTag;
  return mat;
}

/** Swap every tagged material for the given finishes. Geometry is untouched. */
export function recolor(root: THREE.Object3D, f: FinishSet) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const tag = (mesh.material as THREE.Material).userData?.finish as FinishTag | undefined;
    if (tag) mesh.material = finishMaterial(f, tag.chain, tag.shade, tag.fallbackShade);
  });
}
