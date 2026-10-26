import type { CSSProperties } from "react";
import { duration } from "./tokens";

const glide = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Fade a panel in/out without trapping focus: it becomes visible instantly on
 * open (so focus can move into it) and only turns hidden after fading out.
 */
export function fadeStyle(open: boolean, ms: number = duration.standard): CSSProperties {
  return {
    transition: open
      ? `opacity ${ms}ms ${glide}, visibility 0s linear 0s`
      : `opacity ${ms}ms ${glide}, visibility 0s linear ${ms}ms`,
  };
}
