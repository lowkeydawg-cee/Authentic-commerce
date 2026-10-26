"use client";

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

export function saveOrder(order: DemoOrder) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "[]") as DemoOrder[];
    localStorage.setItem(KEY, JSON.stringify([order, ...all].slice(0, 20)));
  } catch {
    /* storage unavailable */
  }
}

export function orderReference() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
  return `VSP-${n}`;
}
