"use client";

import { useSyncExternalStore } from "react";

/**
 * Client bag (Step 9 · milestone 4 needs add-to-bag; the drawer, bag page
 * and checkout arrive in milestone 7). Persisted to localStorage, synced
 * across tabs. Replaced by the commerce platform's cart API later.
 */
export interface BagLine {
  slug: string;
  colorwayId: string;
  size: string;
  quantity: number;
}

const KEY = "vesper:bag:v1";
type Listener = () => void;
const listeners = new Set<Listener>();
let lines: BagLine[] = [];
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    lines = JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    lines = [];
  }
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    try {
      lines = JSON.parse(e.newValue ?? "[]");
    } catch {
      lines = [];
    }
    listeners.forEach((l) => l());
  });
}

function commit(next: BagLine[]) {
  lines = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* storage unavailable: the bag still works for this session */
  }
  listeners.forEach((l) => l());
}

export const bag = {
  subscribe(l: Listener) {
    load();
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getLines() {
    load();
    return lines;
  },
  add(line: Omit<BagLine, "quantity">, quantity = 1) {
    const same = (l: BagLine) => l.slug === line.slug && l.colorwayId === line.colorwayId && l.size === line.size;
    const existing = lines.find(same);
    commit(existing ? lines.map((l) => (same(l) ? { ...l, quantity: l.quantity + quantity } : l)) : [...lines, { ...line, quantity }]);
  },
  setQuantity(index: number, quantity: number) {
    commit(quantity <= 0 ? lines.filter((_, i) => i !== index) : lines.map((l, i) => (i === index ? { ...l, quantity } : l)));
  },
  clear() {
    commit([]);
  },
};

const EMPTY: BagLine[] = [];

export function useBag(): BagLine[] {
  return useSyncExternalStore(bag.subscribe, bag.getLines, () => EMPTY);
}

export function useBagCount(): number {
  return useBag().reduce((n, l) => n + l.quantity, 0);
}
