"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { ProductArt } from "@/components/ui/ProductArt";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useInventory, useStorefrontCatalog } from "@/store/inventory";
import { toast } from "@/store/toast";

/** Keeps every cart line within live stock, wherever the stock change came from. */
function useCartStockGuard() {
  const { products, ready } = useStorefrontCatalog();
  const { error } = useInventory();
  const reconcile = useCart((s) => s.reconcile);
  useEffect(() => {
    // Never reconcile against an empty/failed load — that would wipe the cart.
    if (!ready || error) return;
    const stock = new Map(products.map((p) => [p.id, p.stock]));
    const reduced = reconcile(stock);
    if (reduced.length) {
      const names = reduced.map((id) => products.find((p) => p.id === id)?.title ?? "An item");
      toast({
        tone: "warning",
        title: "Your cart was updated",
        description: `${names.join(", ")} ${names.length === 1 ? "has" : "have"} less stock available now.`,
      });
    }
  }, [products, ready, error, reconcile]);
}

export function CartDrawer() {
  useCartStockGuard();
  const { open, setOpen, lines, setQuantity, remove, setCheckoutOpen } = useCart();
  const { products, categories, settings } = useInventory();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const items = useMemo(
    () =>
      lines
        .map((l) => ({ line: l, product: products.find((p) => p.id === l.productId) }))
        .filter((i): i is { line: typeof i.line; product: NonNullable<typeof i.product> } => !!i.product),
    [lines, products],
  );
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.line.quantity, 0);
  const slugOf = (id: string) => categories.find((c) => c.id === id)?.slug;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-label="Shopping cart"
            className="glass-strong fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col sm:m-3 sm:rounded-3xl"
            initial={{ x: "105%" }}
            animate={{ x: 0 }}
            exit={{ x: "105%" }}
            transition={{ type: "spring", stiffness: 300, damping: 34 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div>
                <h2 className="font-display text-2xl">Your cart</h2>
                <p className="text-xs text-white/50">
                  {items.length} {items.length === 1 ? "item" : "items"} · stock reserved at checkout
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-white/60 transition hover:rotate-90 hover:bg-white/10 hover:text-white"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-6">
              {items.length === 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col items-center justify-center text-center">
                  <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                    <ShoppingBag className="h-12 w-12 text-white/20" strokeWidth={1} />
                  </motion.div>
                  <p className="mt-4 font-display text-xl">Your cart is empty</p>
                  <p className="mt-1 text-sm text-white/50">Discover something crafted to last.</p>
                  <Button className="mt-6" variant="glass" onClick={() => setOpen(false)}>
                    Continue shopping
                  </Button>
                </motion.div>
              )}

              <AnimatePresence initial={false}>
                {items.map(({ line, product }) => {
                  const atMax = line.quantity >= product.stock;
                  return (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 60, height: 0, marginTop: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                      className="group flex gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-3"
                    >
                      <ProductArt product={product} categorySlug={slugOf(product.categoryId)} className="h-20 w-20 shrink-0 rounded-xl" iconClassName="h-8 w-8" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate font-medium">{product.title}</p>
                          <button
                            onClick={() => remove(product.id)}
                            className="rounded-full p-1 text-white/30 transition hover:bg-rose-500/10 hover:text-rose-300"
                            aria-label={`Remove ${product.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gold-200">{formatMoney(product.price, settings.currency)}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center rounded-full bg-white/5 ring-1 ring-white/10">
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() => setQuantity(product.id, line.quantity - 1, product.stock)}
                              className="grid h-8 w-8 place-items-center rounded-full text-white/70 hover:text-white"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </motion.button>
                            <motion.span key={line.quantity} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-7 text-center text-sm tabular-nums">
                              {line.quantity}
                            </motion.span>
                            <motion.button
                              whileTap={atMax ? { x: [0, -3, 3, 0] } : { scale: 0.8 }}
                              onClick={() => {
                                if (atMax) {
                                  toast({ tone: "warning", title: "Stock limit reached", description: `Only ${product.stock} available.` });
                                  return;
                                }
                                setQuantity(product.id, line.quantity + 1, product.stock);
                              }}
                              className="grid h-8 w-8 place-items-center rounded-full text-white/70 hover:text-white aria-disabled:opacity-30"
                              aria-disabled={atMax}
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </motion.button>
                          </div>
                          {atMax && (
                            <span className="flex items-center gap-1 text-[11px] text-amber-300">
                              <AlertTriangle className="h-3 w-3" /> Max available
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {items.length > 0 && (
              <div className="space-y-4 border-t border-white/10 p-6">
                <div className="flex justify-between text-sm text-white/60">
                  <span>Delivery</span>
                  <span className="text-emerald-300">Free</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-white/60">Subtotal</span>
                  <motion.span key={subtotal} initial={{ scale: 1.1, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} className="font-display text-2xl text-gold-200">
                    {formatMoney(subtotal, settings.currency)}
                  </motion.span>
                </div>
                <Button size="lg" className="w-full" onClick={() => setCheckoutOpen(true)}>
                  Proceed to checkout
                </Button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
