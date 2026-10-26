"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Minus, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ProductArt } from "@/components/ui/ProductArt";
import { formatMoney } from "@/lib/format";
import { STATUS_STYLES, stockStatus, type StockStatus } from "@/lib/stock";
import type { Product } from "@/lib/types";
import { useInventory } from "@/store/inventory";
import { toast } from "@/store/toast";
import { ProductFormModal } from "./ProductFormModal";

type Filter = "all" | StockStatus | "hidden";

/** Number input that commits on blur / Enter and reverts on Escape. */
function InlineNumber({
  value,
  onCommit,
  className,
  step = 1,
  ariaLabel,
}: {
  value: number;
  onCommit: (n: number) => void;
  className?: string;
  step?: number | "any";
  ariaLabel: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const n = Number(draft);
    setDraft(null);
    if (Number.isFinite(n) && n >= 0 && n !== value) onCommit(n);
  };
  return (
    <input
      type="number"
      min={0}
      step={step}
      aria-label={ariaLabel}
      value={draft ?? value}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setDraft(null);
      }}
      className={clsx(
        "rounded-lg border border-transparent bg-transparent px-2 py-1 tabular-nums outline-none transition hover:border-white/10 focus:border-gold-300/50 focus:bg-white/5",
        className,
      )}
    />
  );
}

export function InventoryTable() {
  const { products, categories, settings, repo, recentlyChanged } = useInventory();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const threshold = settings.lowStockThreshold;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => {
        if (filter === "hidden" && p.visible) return false;
        if (filter !== "all" && filter !== "hidden" && stockStatus(p.stock, threshold) !== filter) return false;
        if (!q) return true;
        return p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      })
      .sort((a, b) => a.sku.localeCompare(b.sku));
  }, [products, query, filter, threshold]);

  const counts = useMemo(() => {
    const c = { all: products.length, healthy: 0, low: 0, out: 0, hidden: 0 };
    for (const p of products) {
      c[stockStatus(p.stock, threshold)]++;
      if (!p.visible) c.hidden++;
    }
    return c;
  }, [products, threshold]);

  const run = async (fn: () => Promise<void>, success?: string) => {
    try {
      await fn();
      if (success) toast({ tone: "success", title: success });
    } catch (e) {
      toast({ tone: "error", title: "Update failed", description: e instanceof Error ? e.message : undefined });
    }
  };

  const filters: { id: Filter; label: string; dot?: string }[] = [
    { id: "all", label: "All" },
    { id: "healthy", label: "Healthy", dot: STATUS_STYLES.healthy.dot },
    { id: "low", label: "Low", dot: STATUS_STYLES.low.dot },
    { id: "out", label: "Out", dot: STATUS_STYLES.out.dot },
    { id: "hidden", label: "Hidden" },
  ];

  return (
    <div className="glass overflow-hidden rounded-3xl">
      <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={clsx(
                "relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors",
                filter === f.id ? "text-white" : "text-white/50 hover:text-white",
              )}
            >
              {filter === f.id && (
                <motion.span layoutId="inv-filter" className="absolute inset-0 rounded-full bg-white/10" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
              )}
              {f.dot && <span className={clsx("relative h-2 w-2 rounded-full", f.dot)} />}
              <span className="relative">{f.label}</span>
              <span className="relative text-xs text-white/35">{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <label className="flex h-10 flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 lg:w-64">
            <Search className="h-4 w-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search SKU or title"
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/35"
            />
          </label>
          <Button
            size="sm"
            className="h-10"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add product
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-white/40">
            <tr className="border-b border-white/5">
              <th className="px-5 py-3 font-medium">SKU</th>
              <th className="px-3 py-3 font-medium">Product</th>
              <th className="px-3 py-3 font-medium">Category</th>
              <th className="px-3 py-3 font-medium">Unit price</th>
              <th className="px-3 py-3 font-medium">Remaining qty</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Controls</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((p) => {
                const status = stockStatus(p.stock, threshold);
                const style = STATUS_STYLES[status];
                const category = categoryById.get(p.categoryId);
                const flashing = recentlyChanged.has(p.id);
                return (
                  <motion.tr
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{
                      opacity: p.visible ? 1 : 0.55,
                      y: 0,
                      backgroundColor: flashing ? "rgba(224,187,99,0.12)" : "rgba(0,0,0,0)",
                    }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.35 }}
                    className="group border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-white/60">{p.sku}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <ProductArt product={p} categorySlug={category?.slug} className="h-10 w-10 shrink-0 rounded-lg" iconClassName="h-5 w-5" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.title}</p>
                          {p.featured && <p className="text-[11px] text-gold-300">Featured</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={p.categoryId}
                        onChange={(e) => run(() => repo.updateProduct(p.id, { categoryId: e.target.value }), "Category updated")}
                        className="w-36 rounded-lg border border-transparent bg-transparent py-1 text-white/70 outline-none hover:border-white/10"
                        aria-label={`Category for ${p.title}`}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id} className="bg-ink-900">{c.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 text-white/40">
                        <span className="text-xs">{settings.currency}</span>
                        <InlineNumber
                          ariaLabel={`Price for ${p.title}`}
                          value={p.price}
                          step="any"
                          className="w-28 text-white"
                          onCommit={(price) => run(() => repo.updateProduct(p.id, { price }), `Price updated · ${formatMoney(price, settings.currency)}`)}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => run(() => repo.adjustStock(p.id, -1))}
                          disabled={p.stock <= 0}
                          className="grid h-7 w-7 place-items-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
                          aria-label={`Decrease stock for ${p.title}`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </motion.button>
                        <motion.div key={p.stock} initial={{ scale: 1.3, color: "#ecd394" }} animate={{ scale: 1, color: "#ffffff" }} transition={{ duration: 0.5 }}>
                          <InlineNumber
                            ariaLabel={`Stock for ${p.title}`}
                            value={p.stock}
                            className="w-16 text-center font-semibold"
                            onCommit={(stock) => run(() => repo.updateProduct(p.id, { stock: Math.floor(stock) }), "Stock updated")}
                          />
                        </motion.div>
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => run(() => repo.adjustStock(p.id, 1))}
                          className="grid h-7 w-7 place-items-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
                          aria-label={`Increase stock for ${p.title}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </motion.button>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", style.chip)}>
                        <span className={clsx("h-1.5 w-1.5 rounded-full", style.dot, status !== "healthy" && "animate-pulse")} />
                        {style.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconToggle
                          active={p.featured}
                          label={p.featured ? "Unfeature" : "Feature in hero"}
                          onClick={() => run(() => repo.updateProduct(p.id, { featured: !p.featured }))}
                          activeClass="text-gold-300"
                        >
                          <Star className={clsx("h-4 w-4", p.featured && "fill-current")} />
                        </IconToggle>
                        <IconToggle
                          active={p.visible}
                          label={p.visible ? "Hide from storefront" : "Show on storefront"}
                          onClick={() => run(() => repo.updateProduct(p.id, { visible: !p.visible }), p.visible ? "Hidden from storefront" : "Now visible on storefront")}
                          activeClass="text-emerald-300"
                        >
                          {p.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </IconToggle>
                        <IconToggle
                          active={false}
                          label="Edit"
                          onClick={() => {
                            setEditing(p);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconToggle>
                        {confirmDelete === p.id ? (
                          <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} className="flex gap-1 overflow-hidden">
                            <Button size="sm" variant="danger" className="h-8" onClick={() => run(() => repo.deleteProduct(p.id), "Product deleted")}>
                              Delete
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8" onClick={() => setConfirmDelete(null)}>
                              Cancel
                            </Button>
                          </motion.div>
                        ) : (
                          <IconToggle active={false} label="Delete" onClick={() => setConfirmDelete(p.id)} hoverClass="hover:text-rose-300">
                            <Trash2 className="h-4 w-4" />
                          </IconToggle>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-10 text-center text-sm text-white/40">No products match this view.</p>}
      </div>

      <ProductFormModal open={formOpen} onClose={() => setFormOpen(false)} product={editing} />
    </div>
  );
}

function IconToggle({
  active,
  label,
  onClick,
  children,
  activeClass = "text-white",
  hoverClass = "hover:text-white",
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  activeClass?: string;
  hoverClass?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.8, rotate: -8 }}
      whileHover={{ scale: 1.1 }}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={clsx("grid h-8 w-8 place-items-center rounded-full transition hover:bg-white/10", active ? activeClass : "text-white/40", hoverClass)}
    >
      {children}
    </motion.button>
  );
}
