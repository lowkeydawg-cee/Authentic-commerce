"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useInventoryState } from "@/lib/inventory/live";
import { skuOf } from "@/lib/inventory/types";
import { lookupSku } from "@/lib/inventory/pricing";
import { bag, useBag } from "./store";

/**
 * Keeps the bag honest against live stock: when a piece sells out, or drops
 * below the quantity in the bag, the line is reduced or removed and the
 * shopper is told why. Mounted once, globally (in the bag drawer).
 */
let notices: string[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const bagNotices = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => notices,
  push(list: string[]) {
    const fresh = list.filter((m) => !notices.includes(m));
    if (!fresh.length) return;
    notices = [...notices, ...fresh];
    emit();
  },
  clear() {
    notices = [];
    emit();
  },
};

const NONE: string[] = [];
export function useBagNotices(): string[] {
  return useSyncExternalStore(bagNotices.subscribe, bagNotices.get, () => NONE);
}

export function useBagStockGuard() {
  const lines = useBag();
  const { snapshot } = useInventoryState();

  useEffect(() => {
    // Read the bag as it is now: two stock refreshes can land before React re-renders.
    const current = bag.getLines();
    if (!snapshot || current.length === 0) return;
    const messages: string[] = [];
    const next = current.flatMap((l) => {
      const onHand = snapshot.levels[skuOf(l.slug, l.colorwayId, l.size)] ?? 0;
      if (l.quantity <= onHand) return [l];
      const hit = lookupSku(skuOf(l.slug, l.colorwayId, l.size));
      const name = hit ? `${hit.product.title} in ${hit.colorway.name}${hit.product.sizes.length > 1 ? `, size ${l.size}` : ""}` : "A piece";
      if (onHand <= 0) {
        messages.push(`${name} has just sold out and was removed from your bag.`);
        return [];
      }
      messages.push(`Only ${onHand} of ${name} ${onHand === 1 ? "is" : "are"} left, so your bag now holds ${onHand}.`);
      return [{ ...l, quantity: onHand }];
    });
    if (messages.length) {
      bag.replace(next);
      bagNotices.push(messages);
    }
  }, [snapshot, lines]);
}
