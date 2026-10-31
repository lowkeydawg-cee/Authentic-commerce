"use client";

import { useSyncExternalStore } from "react";
import { getInventory } from "./index";
import { DEFAULT_SETTINGS, SEED_LEVELS } from "./seed";
import { stockStatus, type InventorySnapshot, type StockStatus } from "./types";

/**
 * One live copy of the inventory for the whole page: loaded on first use,
 * then refreshed whenever the backend reports a change (another tab, the
 * admin, another shopper's order).
 */
type State = { snapshot: InventorySnapshot | null; error: string | null };
let state: State = { snapshot: null, error: null };
let started = false;
let forceRefresh: (() => Promise<void>) | null = null;
const listeners = new Set<() => void>();

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

async function start() {
  if (started) return;
  started = true;
  try {
    const repo = await getInventory();
    let seq = 0;
    const refresh = async () => {
      const mine = ++seq;
      try {
        const snapshot = await repo.load();
        if (mine === seq) set({ snapshot, error: null });
      } catch (e) {
        if (mine === seq) set({ error: e instanceof Error ? e.message : String(e) });
      }
    };
    repo.subscribe(refresh);
    forceRefresh = refresh;
    await refresh();
  } catch (e) {
    set({ error: e instanceof Error ? e.message : String(e) });
  }
}

/** Reload now (e.g. after a checkout conflict, which changes nothing the backend would broadcast). */
export function refreshInventory() {
  return forceRefresh?.();
}

function subscribe(l: () => void) {
  void start();
  listeners.add(l);
  return () => listeners.delete(l);
}

const SERVER: State = { snapshot: null, error: null };

/** The full live inventory, or null until it has loaded (and during server render). */
export function useInventoryState(): State {
  return useSyncExternalStore(subscribe, () => state, () => SERVER);
}

export interface StockView {
  /** True once live numbers have arrived; before that, the opening seed is shown. */
  live: boolean;
  onHand(sku: string): number;
  status(sku: string): StockStatus;
  threshold: number;
}

/** Stock lookups for the storefront, falling back to the opening seed before the live data loads. */
export function useStock(): StockView {
  const { snapshot } = useInventoryState();
  const levels = snapshot?.levels ?? SEED_LEVELS;
  const threshold = snapshot?.settings.lowStockThreshold ?? DEFAULT_SETTINGS.lowStockThreshold;
  const onHand = (sku: string) => levels[sku] ?? 0;
  return { live: !!snapshot, onHand, status: (sku) => stockStatus(onHand(sku), threshold), threshold };
}
