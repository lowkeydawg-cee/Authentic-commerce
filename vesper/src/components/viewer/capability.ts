/**
 * Step 8 · mobile optimisation: pick a 3D tier per device so phones and
 * low-power machines never pay for 3D they can't run smoothly.
 *
 * Milestone 9: creating a WebGL context just to test support is expensive, so
 * page load never does it. Auto-start devices let the viewer's own canvas be
 * the test (it falls back to photos on failure); tap-to-start devices probe
 * right before 3D opens. The result is cached for the session.
 */
export type Tier = "high" | "medium" | "none";

export interface Capability {
  tier: Tier;
  /** Start 3D without a tap (desktop, capable, motion allowed, not saving data). */
  auto: boolean;
  dpr: [number, number];
  shadows: boolean;
  /** True once a real WebGL2 context has been created successfully. */
  verified: boolean;
}

const NONE: Capability = { tier: "none", auto: false, dpr: [1, 1], shadows: false, verified: false };
const CACHE_KEY = "vesper:webgl2";
let probed: boolean | null = null;

/** Creates (and immediately releases) a WebGL2 context. Cached per session. */
export function probeWebGL(): boolean {
  if (probed !== null) return probed;
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached !== null) return (probed = cached === "1");
  } catch {
    /* storage unavailable */
  }
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    probed = !!gl;
  } catch {
    probed = false;
  }
  try {
    sessionStorage.setItem(CACHE_KEY, probed ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
  return probed;
}

export function detectCapability(): Capability {
  if (typeof window === "undefined" || typeof WebGL2RenderingContext === "undefined") return NONE;

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const saveData = nav.connection?.saveData === true || /(^|-)2g$/.test(nav.connection?.effectiveType ?? "");
  const lowPower = (nav.deviceMemory ?? 8) < 4 || (nav.hardwareConcurrency ?? 8) < 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wantsAuto = !coarse && !reduced && !saveData && !lowPower;

  const tier: Tier = lowPower || saveData ? "medium" : "high";
  return {
    tier,
    auto: wantsAuto,
    dpr: tier === "high" ? [1, Math.min(2, window.devicePixelRatio || 1)] : [1, 1.25],
    shadows: tier === "high",
    verified: wantsAuto, // the viewer canvas is the test; failure falls back to photos
  };
}
