/**
 * Motion system (Step 7, "more cinematic" variant). Shared by CSS (via the
 * Tailwind theme), GSAP and the 3D camera so everything moves with one rhythm.
 */
export const ease = {
  glide: [0.22, 1, 0.36, 1] as const,
  camera: [0.65, 0, 0.35, 1] as const,
  quiet: [0.4, 0, 0.2, 1] as const,
  /** GSAP-compatible names for the same curves. */
  gsap: {
    glide: "expo.out",
    camera: "power2.inOut",
    quiet: "power1.inOut",
  },
};

/** Durations in milliseconds. Mobile values are ~20–35% shorter. */
export const duration = {
  instant: 150,
  quick: 300,
  standard: 600,
  heroReveal: { desktop: 1500, mobile: 1000 },
  chapterCamera: { desktop: 1500, mobile: 1000 },
  hotspotCamera: { desktop: 1300, mobile: 1000 },
  reducedMotionFade: 200,
};

export const stagger = 80;
export const maxRise = 24;
