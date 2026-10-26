"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CartLine {
  productId: string;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  open: boolean;
  checkoutOpen: boolean;
  /** Adds up to `maxAvailable`; returns how many units were actually added. */
  add: (productId: string, maxAvailable: number, quantity?: number) => number;
  setQuantity: (productId: string, quantity: number, maxAvailable: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  /** Clamp every line to live stock; returns ids whose quantity was reduced. */
  reconcile: (stockById: Map<string, number>) => string[];
  setOpen: (open: boolean) => void;
  setCheckoutOpen: (open: boolean) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      open: false,
      checkoutOpen: false,

      add(productId, maxAvailable, quantity = 1) {
        const existing = get().lines.find((l) => l.productId === productId);
        const current = existing?.quantity ?? 0;
        const next = Math.min(maxAvailable, current + quantity);
        const added = Math.max(0, next - current);
        if (added === 0) return 0;
        set({
          lines: existing
            ? get().lines.map((l) => (l.productId === productId ? { ...l, quantity: next } : l))
            : [...get().lines, { productId, quantity: next }],
        });
        return added;
      },

      setQuantity(productId, quantity, maxAvailable) {
        const clamped = Math.max(0, Math.min(maxAvailable, Math.floor(quantity)));
        set({
          lines:
            clamped === 0
              ? get().lines.filter((l) => l.productId !== productId)
              : get().lines.map((l) => (l.productId === productId ? { ...l, quantity: clamped } : l)),
        });
      },

      remove(productId) {
        set({ lines: get().lines.filter((l) => l.productId !== productId) });
      },

      clear() {
        set({ lines: [] });
      },

      reconcile(stockById) {
        const reduced: string[] = [];
        const lines = get()
          .lines.map((l) => {
            const available = stockById.get(l.productId) ?? 0;
            if (l.quantity > available) {
              reduced.push(l.productId);
              return { ...l, quantity: available };
            }
            return l;
          })
          .filter((l) => l.quantity > 0);
        if (reduced.length) set({ lines });
        return reduced;
      },

      setOpen(open) {
        set({ open });
      },
      setCheckoutOpen(checkoutOpen) {
        set({ checkoutOpen, open: checkoutOpen ? false : get().open });
      },
    }),
    {
      name: "authentic-commerce:cart:v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
    },
  ),
);
