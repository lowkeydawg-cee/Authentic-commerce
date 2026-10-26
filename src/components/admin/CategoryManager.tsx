"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { slugify } from "@/lib/format";
import { useInventory } from "@/store/inventory";
import { toast } from "@/store/toast";

export function CategoryManager() {
  const { categories, products, repo } = useInventory();
  const [name, setName] = useState("");
  const sorted = useMemo(() => [...categories].sort((a, b) => a.sortOrder - b.sortOrder), [categories]);
  const productCount = (id: string) => products.filter((p) => p.categoryId === id).length;

  const run = async (fn: () => Promise<unknown>, success?: string) => {
    try {
      await fn();
      if (success) toast({ tone: "success", title: success });
    } catch (e) {
      toast({ tone: "error", title: "Couldn't update category", description: e instanceof Error ? e.message : undefined });
    }
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const slug = slugify(trimmed);
    if (categories.some((c) => c.slug === slug)) {
      toast({ tone: "warning", title: "That category already exists" });
      return;
    }
    const sortOrder = Math.max(0, ...categories.map((c) => c.sortOrder)) + 1;
    void run(() => repo.createCategory({ name: trimmed, slug, visible: true, sortOrder }), `Added ${trimmed}`);
    setName("");
  };

  /** Swap with the neighbour, then renumber so storefront tabs reorder predictably. */
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sorted.length) return;
    const next = [...sorted];
    [next[index], next[target]] = [next[target], next[index]];
    void run(() =>
      Promise.all(
        next.map((c, i) => (c.sortOrder === i + 1 ? null : repo.updateCategory(c.id, { sortOrder: i + 1 }))),
      ),
    );
  };

  return (
    <div className="glass rounded-3xl p-5">
      <h3 className="font-display text-xl">Categories</h3>
      <p className="mt-1 text-sm text-white/45">Control which categories appear on the storefront and in what order.</p>

      <form onSubmit={add} className="mt-5 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" className={clsx(inputClass, "py-2.5")} />
        <Button type="submit" size="sm" className="h-auto shrink-0 px-4"><Plus className="h-4 w-4" /> Add</Button>
      </form>

      <ul className="mt-4 space-y-2">
        <AnimatePresence initial={false}>
          {sorted.map((c, i) => (
            <motion.li
              key={c.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: c.visible ? 1 : 0.55, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-2 pl-3"
            >
              <input
                key={c.name}
                defaultValue={c.name}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== c.name) void run(() => repo.updateCategory(c.id, { name: v }), "Category renamed");
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                className="min-w-0 flex-1 rounded-lg bg-transparent px-1 py-1 text-sm outline-none focus:bg-white/5"
                aria-label="Category name"
              />
              <span className="shrink-0 text-xs text-white/35">{productCount(c.id)} items</span>
              <div className="flex shrink-0">
                <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></IconBtn>
                <IconBtn label="Move down" disabled={i === sorted.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></IconBtn>
                <IconBtn label={c.visible ? "Hide category" : "Show category"} onClick={() => run(() => repo.updateCategory(c.id, { visible: !c.visible }))}>
                  {c.visible ? <Eye className="h-4 w-4 text-emerald-300" /> : <EyeOff className="h-4 w-4" />}
                </IconBtn>
                <IconBtn label="Delete category" onClick={() => run(() => repo.deleteCategory(c.id), "Category deleted")}>
                  <Trash2 className="h-4 w-4 hover:text-rose-300" />
                </IconBtn>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.8 }}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-20"
    >
      {children}
    </motion.button>
  );
}
