"use client";

import { useSyncExternalStore } from "react";
import type { Money } from "@/lib/commerce/types";
import type { BagLine } from "./store";

/** Prototype order record. Real orders come from the commerce platform. */
export interface DemoOrder {
  reference: string;
  createdAt: string;
  email: string;
  name: string;
  lines: BagLine[];
  total: Money;
  delivery: string;
  payment: string;
}

const KEY = "vesper:orders:v1";

const listeners = new Set<() => void>();
let cache: { raw: string | null; orders: DemoOrder[] } = { raw: null, orders: [] };

function read(): DemoOrder[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    /* storage unavailable */
  }
  if (raw !== cache.raw) {
    try {
      cache = { raw, orders: raw ? (JSON.parse(raw) as DemoOrder[]) : [] };
    } catch {
      cache = { raw, orders: [] };
    }
  }
  return cache.orders;
}

function write(orders: DemoOrder[]) {
  try {
    if (orders.length) localStorage.setItem(KEY, JSON.stringify(orders));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function saveOrder(order: DemoOrder) {
  write([order, ...read()].slice(0, 20));
}

export function clearOrders() {
  write([]);
}

const NONE: DemoOrder[] = [];

/** Orders placed in this browser, newest first. Empty during server render. */
export function useOrders(): DemoOrder[] {
  return useSyncExternalStore(subscribe, read, () => NONE);
}

export function orderReference() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
  return `VSP-${n}`;
}
