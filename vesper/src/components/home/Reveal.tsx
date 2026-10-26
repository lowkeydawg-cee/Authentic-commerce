"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** "rise" for text, "wipe" for images (Step 7 · product reveals). */
  variant?: "rise" | "wipe";
  delay?: number;
  as?: "div" | "li" | "section";
}

/** Animates once when the element first scrolls into view. */
export function Reveal({ children, className, variant = "rise", delay = 0, as: Tag = "div" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-reveal=""
      style={{ transitionDelay: `${delay}ms` }}
      className={clsx(
        "ease-glide",
        variant === "rise" && "transition-[opacity,transform] duration-[900ms]",
        variant === "rise" && (shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"),
        variant === "wipe" && "transition-[clip-path,transform] duration-[1100ms]",
        variant === "wipe" && (shown ? "scale-100 [clip-path:inset(0_0_0_0)]" : "scale-[1.04] [clip-path:inset(100%_0_0_0)]"),
        className,
      )}
    >
      {children}
    </Tag>
  );
}
