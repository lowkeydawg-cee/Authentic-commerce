/**
 * Step 8 · mobile optimisation: pick a 3D tier per device so phones and
 * low-power machines never pay for 3D they can't run smoothly.
 */
export type Tier = "high" | "medium" | "none";

export interface Capability {
  tier: Tier;
  /** Start 3D without a tap (desktop, capable, motion allowed, not saving data). */
  auto: boolean;
  dpr: [number, number];
  shadows: boolean;
}

const NONE: Capability = { tier: "none", auto: false, dpr: [1, 1], shadows: false };

export function detectCapability(): Capability {
  if (typeof window === "undefined") return NONE;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return NONE;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    return NONE;
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const saveData = nav.connection?.saveData === true || /(^|-)2g$/.test(nav.connection?.effectiveType ?? "");
  const lowPower = (nav.deviceMemory ?? 8) < 4 || (nav.hardwareConcurrency ?? 8) < 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const tier: Tier = lowPower || saveData ? "medium" : "high";
  return {
    tier,
    auto: !coarse && !reduced && !saveData && !lowPower,
    dpr: tier === "high" ? [1, Math.min(2, window.devicePixelRatio || 1)] : [1, 1.25],
    shadows: tier === "high",
  };
}
