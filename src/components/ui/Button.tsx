"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import clsx from "clsx";
import { forwardRef } from "react";

type Variant = "primary" | "glass" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 text-ink-950 shadow-glow hover:brightness-110",
  glass: "glass text-white hover:bg-white/10",
  ghost: "text-white/70 hover:text-white hover:bg-white/5",
  danger: "bg-rose-500/15 text-rose-200 ring-1 ring-inset ring-rose-400/30 hover:bg-rose-500/25",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-base gap-2.5",
};

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, disabled, className, children, ...rest },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <motion.button
      ref={ref}
      whileHover={isDisabled ? undefined : { y: -1 }}
      whileTap={isDisabled ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      disabled={isDisabled}
      className={clsx(
        "relative inline-flex select-none items-center justify-center rounded-full font-medium transition-[background,filter,color,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300/70 disabled:cursor-not-allowed disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children as React.ReactNode}
    </motion.button>
  );
});
