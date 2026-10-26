"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getRepository, type StoreRepository } from "@/lib/data";
import { DEFAULT_SETTINGS } from "@/lib/seed";
import type { StoreSnapshot } from "@/lib/types";

interface InventoryContextValue extends StoreSnapshot {
  ready: boolean;
  error: string | null;
  repo: StoreRepository;
  /** Ids of products whose stock changed in the last sync (for flash animations). */
  recentlyChanged: Set<string>;
  refresh: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

const EMPTY: StoreSnapshot = { products: [], categories: [], settings: DEFAULT_SETTINGS, orders: [] };

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const repo = useMemo(() => getRepository(), []);
  const [snapshot, setSnapshot] = useState<StoreSnapshot>(EMPTY);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentlyChanged, setRecentlyChanged] = useState<Set<string>>(new Set());
  const previousStock = useRef<Map<string, number>>(new Map());

  const refresh = useCallback(async () => {
    try {
      const next = await repo.load();
      const changed = new Set<string>();
      for (const p of next.products) {
        const before = previousStock.current.get(p.id);
        if (before !== undefined && before !== p.stock) changed.add(p.id);
      }
      previousStock.current = new Map(next.products.map((p) => [p.id, p.stock]));
      setSnapshot(next);
      setError(null);
      if (changed.size) {
        setRecentlyChanged(changed);
        setTimeout(() => setRecentlyChanged(new Set()), 1600);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the store.");
    } finally {
      setReady(true);
    }
  }, [repo]);

  useEffect(() => {
    void refresh();
    const unsubscribe = repo.subscribe(() => void refresh());
    const unsubscribeAuth = repo.onAuthChange(() => void refresh());
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      unsubscribe();
      unsubscribeAuth();
      window.removeEventListener("focus", onFocus);
    };
  }, [repo, refresh]);

  const value = useMemo<InventoryContextValue>(
    () => ({ ...snapshot, ready, error, repo, recentlyChanged, refresh }),
    [snapshot, ready, error, repo, recentlyChanged, refresh],
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory(): InventoryContextValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used inside <InventoryProvider>");
  return ctx;
}

/** Storefront view: only visible products in visible categories, ordered by category. */
export function useStorefrontCatalog() {
  const { products, categories, settings, ready } = useInventory();
  return useMemo(() => {
    const visibleCategories = categories
      .filter((c) => c.visible)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const allowed = new Set(visibleCategories.map((c) => c.id));
    const visibleProducts = products.filter((p) => p.visible && allowed.has(p.categoryId));
    return { categories: visibleCategories, products: visibleProducts, settings, ready };
  }, [products, categories, settings, ready]);
}
