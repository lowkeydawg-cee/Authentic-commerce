"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { LayoutDashboard, ShoppingBag } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { useState } from "react";
import { useCart } from "@/store/cart";
import { useInventory } from "@/store/inventory";

export function Navbar() {
  const { settings } = useInventory();
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  const setOpen = useCart((s) => s.setOpen);
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 26, delay: 0.1 }}
        className={clsx(
          "mx-auto flex h-14 max-w-7xl items-center justify-between rounded-full px-4 transition-all duration-500 sm:px-6",
          scrolled ? "glass-strong" : "border border-transparent",
        )}
      >
        <Link href="/" className="group flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-gold-200 to-gold-500 font-display text-sm font-bold text-ink-950 transition-transform duration-500 group-hover:rotate-[360deg]">
            {settings.storeName.charAt(0)}
          </span>
          <span className="font-display text-lg tracking-wide">{settings.storeName}</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-white/60 md:flex">
          <a href="#catalog" className="transition hover:text-white">Shop</a>
          <a href="#featured" className="transition hover:text-white">Featured</a>
          <a href="#promise" className="transition hover:text-white">Our promise</a>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/admin"
            className="flex h-10 items-center gap-2 rounded-full px-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-white/5 transition hover:bg-white/10"
            aria-label={`Open cart (${count} items)`}
          >
            <ShoppingBag className="h-5 w-5" />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.3, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 600, damping: 18 }}
                  className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold-400 px-1 text-[11px] font-bold text-ink-950"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.nav>
    </header>
  );
}
