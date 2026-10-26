"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { Check, Plus } from "lucide-react";
import clsx from "clsx";
import { useState } from "react";
import { ProductArt } from "@/components/ui/ProductArt";
import { StockBadge } from "@/components/ui/StockBadge";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart } from "@/store/cart";
import { toast } from "@/store/toast";

interface ProductCardProps {
  product: Product;
  categoryName: string;
  categorySlug: string;
  currency: string;
  lowThreshold: number;
  flash: boolean;
}

export function ProductCard({ product, categoryName, categorySlug, currency, lowThreshold, flash }: ProductCardProps) {
  const inCart = useCart((s) => s.lines.find((l) => l.productId === product.id)?.quantity ?? 0);
  const add = useCart((s) => s.add);
  const [justAdded, setJustAdded] = useState(false);

  // Subtle 3D tilt + cursor-following sheen.
  const rx = useSpring(0, { stiffness: 200, damping: 20 });
  const ry = useSpring(0, { stiffness: 200, damping: 20 });
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const sheen = useMotionTemplate`radial-gradient(400px circle at ${mx}% ${my}%, rgba(255,255,255,0.10), transparent 40%)`;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 8);
    rx.set((0.5 - py) * 8);
    mx.set(px * 100);
    my.set(py * 100);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  const remaining = product.stock - inCart;
  const soldOut = product.stock <= 0;
  const maxed = !soldOut && remaining <= 0;

  const handleAdd = () => {
    const added = add(product.id, product.stock);
    if (added > 0) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
      toast({ tone: "success", title: "Added to cart", description: product.title });
    } else {
      toast({
        tone: "warning",
        title: "Stock limit reached",
        description: `Only ${product.stock} ${product.stock === 1 ? "unit is" : "units are"} available.`,
      });
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={clsx(
        "glass group relative flex flex-col overflow-hidden rounded-3xl p-3 transition-shadow duration-500 hover:shadow-glow",
        flash && "ring-2 ring-gold-300/70",
      )}
    >
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: sheen }} />

      <div className="relative">
        <ProductArt
          product={product}
          categorySlug={categorySlug}
          className={clsx("aspect-square rounded-2xl", soldOut && "grayscale")}
        />
        <div className="absolute left-3 top-3">
          <StockBadge stock={product.stock} lowThreshold={lowThreshold} />
        </div>
        {inCart > 0 && (
          <motion.span
            key={inCart}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute right-3 top-3 rounded-full bg-ink-950/70 px-2.5 py-1 text-[11px] font-medium text-gold-200 backdrop-blur"
          >
            {inCart} in cart
          </motion.span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">{categoryName}</p>
        <h3 className="mt-1 font-display text-xl leading-snug">{product.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-white/50">{product.description}</p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-lg font-semibold text-gold-200">{formatMoney(product.price, currency)}</p>
            <p className="text-[11px] text-white/35">SKU {product.sku}</p>
          </div>
          <motion.button
            whileTap={soldOut || maxed ? undefined : { scale: 0.85 }}
            whileHover={soldOut || maxed ? undefined : { scale: 1.08 }}
            onClick={handleAdd}
            disabled={soldOut}
            aria-label={soldOut ? "Out of stock" : `Add ${product.title} to cart`}
            className={clsx(
              "relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full transition-colors",
              soldOut
                ? "cursor-not-allowed bg-white/5 text-white/25"
                : maxed
                  ? "bg-white/10 text-white/50"
                  : "bg-gradient-to-br from-gold-200 to-gold-500 text-ink-950 shadow-glow",
            )}
          >
            <motion.span
              key={justAdded ? "check" : "plus"}
              initial={{ y: 16, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              {justAdded ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </motion.span>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
