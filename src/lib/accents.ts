import type { ProductAccent } from "./types";

export const ACCENTS: Record<ProductAccent, { gradient: string; glow: string; swatch: string }> = {
  amber: { gradient: "from-amber-300/40 via-orange-500/20 to-transparent", glow: "bg-amber-400/40", swatch: "bg-amber-400" },
  rose: { gradient: "from-rose-300/40 via-pink-500/20 to-transparent", glow: "bg-rose-400/40", swatch: "bg-rose-400" },
  emerald: { gradient: "from-emerald-300/40 via-teal-500/20 to-transparent", glow: "bg-emerald-400/40", swatch: "bg-emerald-400" },
  sky: { gradient: "from-sky-300/40 via-blue-500/20 to-transparent", glow: "bg-sky-400/40", swatch: "bg-sky-400" },
  violet: { gradient: "from-violet-300/40 via-fuchsia-500/20 to-transparent", glow: "bg-violet-400/40", swatch: "bg-violet-400" },
  slate: { gradient: "from-slate-200/30 via-slate-500/20 to-transparent", glow: "bg-slate-300/30", swatch: "bg-slate-300" },
};

export const ACCENT_OPTIONS = Object.keys(ACCENTS) as ProductAccent[];
