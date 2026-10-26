/* Hairline icons drawn to match the 1px VESPER line weight. Decorative only. */
type IconProps = { className?: string };

const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  "aria-hidden": true,
} as const;

export const MenuIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3 8.5h18M3 15.5h18" />
  </svg>
);
export const CloseIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
);
export const BagIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5.5 8.5h13l-1 12h-11l-1-12z" />
    <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
  </svg>
);
export const SearchIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M15 15l5 5" />
  </svg>
);
export const ChevronIcon = ({ className }: IconProps) => (
  <svg {...base} width={12} height={12} className={className}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
