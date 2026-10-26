"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { PackageSearch, Search, X } from "lucide-react";
import clsx from "clsx";
import { useDeferredValue, useMemo, useState } from "react";
import { useInventory, useStorefrontCatalog } from "@/store/inventory";
import { ProductCard } from "./ProductCard";

type Sort = "featured" | "price-asc" | "price-desc" | "stock";

export function Catalog() {
  const { products, categories, settings, ready } = useStorefrontCatalog();
  const { recentlyChanged } = useInventory();
  const [selectedCategory, setActiveCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const deferredQuery = useDeferredValue(query);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  // If an admin hides the selected category, fall back to "All".
  const activeCategory = categoryById.has(selectedCategory) ? selectedCategory : "all";

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (activeCategory !== "all" && p.categoryId !== activeCategory) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (categoryById.get(p.categoryId)?.name.toLowerCase().includes(q) ?? false)
      );
    });
    const sorted = [...list];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "stock":
        sorted.sort((a, b) => b.stock - a.stock);
        break;
      default:
        // Featured first, sold-out last, then category order.
        sorted.sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) ||
            Number(b.stock > 0) - Number(a.stock > 0) ||
            (categoryById.get(a.categoryId)?.sortOrder ?? 0) - (categoryById.get(b.categoryId)?.sortOrder ?? 0),
        );
    }
    return sorted;
  }, [products, activeCategory, deferredQuery, sort, categoryById]);

  const tabs = [{ id: "all", name: "All" }, ...categories];

  return (
    <section id="catalog" className="container-page scroll-mt-24 py-20">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold-300">The collection</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl">Shop by category</h2>
        </div>
        <div className="flex w-full gap-3 md:w-auto">
          <label className="glass group flex h-12 flex-1 items-center gap-2 rounded-full px-4 transition focus-within:border-gold-300/50 md:w-80">
            <Search className="h-4 w-4 text-white/40 transition group-focus-within:text-gold-300" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, SKUs…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/35"
              aria-label="Search products"
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  onClick={() => setQuery("")}
                  className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="glass h-12 rounded-full bg-transparent px-4 text-sm text-white/80 outline-none"
            aria-label="Sort products"
          >
            <option className="bg-ink-900" value="featured">Featured</option>
            <option className="bg-ink-900" value="price-asc">Price: low to high</option>
            <option className="bg-ink-900" value="price-desc">Price: high to low</option>
            <option className="bg-ink-900" value="stock">Most available</option>
          </select>
        </div>
      </div>

      <LayoutGroup>
        <div className="mt-8 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {tabs.map((tab) => {
            const active = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={clsx(
                  "relative shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
                  active ? "text-ink-950" : "text-white/60 hover:text-white",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="category-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-gold-200 to-gold-400"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{tab.name}</span>
              </button>
            );
          })}
        </div>

        <motion.div layout className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {!ready &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass aspect-[3/4] animate-pulse rounded-3xl" />
            ))}
          <AnimatePresence mode="popLayout">
            {filtered.map((p) => {
              const category = categoryById.get(p.categoryId);
              return (
                <ProductCard
                  key={p.id}
                  product={p}
                  categoryName={category?.name ?? ""}
                  categorySlug={category?.slug ?? ""}
                  currency={settings.currency}
                  lowThreshold={settings.lowStockThreshold}
                  flash={recentlyChanged.has(p.id)}
                />
              );
            })}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>

      {ready && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass mt-8 flex flex-col items-center rounded-3xl px-6 py-16 text-center"
        >
          <PackageSearch className="h-10 w-10 text-white/30" />
          <p className="mt-4 font-display text-2xl">Nothing matches that search</p>
          <p className="mt-2 text-sm text-white/50">Try another keyword or browse a different category.</p>
        </motion.div>
      )}
    </section>
  );
}
