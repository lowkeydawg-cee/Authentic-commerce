import { DEFAULT_SETTINGS, seedSnapshot } from "./seed";
import { deliveryFee, priceLine } from "./pricing";
import type { InventoryRepository } from "./repository";
import { orderReference, type InventorySnapshot, type StockConflict, type StoreOrder } from "./types";

const STORAGE_KEY = "vesper:inventory:v1";
const CHANNEL = "vesper:inventory";
const MAX_ORDERS = 200;

function read(): InventorySnapshot {
  const seed = seedSnapshot();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as InventorySnapshot;
    // New catalogue variants pick up their seed stock; existing counts win.
    return { levels: { ...seed.levels, ...parsed.levels }, settings: { ...DEFAULT_SETTINGS, ...parsed.settings }, orders: parsed.orders ?? [] };
  } catch {
    return seed;
  }
}

/**
 * Browser-only backend (zero setup, for review and demos): localStorage for
 * persistence, BroadcastChannel + the storage event to sync every open tab
 * (storefront ↔ admin) instantly, and the Web Locks API so two tabs can
 * never sell the same last unit. Data stays in this browser.
 */
export function createLocalRepository(): InventoryRepository {
  const listeners = new Set<() => void>();
  let channel: BroadcastChannel | null = null;
  let listening = false;
  const notify = () => listeners.forEach((l) => l());

  function ensureChannel() {
    if (listening) return;
    listening = true;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(CHANNEL);
      channel.onmessage = notify;
    }
    // Also covers browsers without BroadcastChannel; fires in other tabs only.
    window.addEventListener("storage", (e) => e.key === STORAGE_KEY && notify());
  }

  async function withLock<T>(fn: () => T): Promise<T> {
    if (navigator.locks) return navigator.locks.request(STORAGE_KEY, async () => fn());
    return fn();
  }

  /** Read-modify-write against the latest stored state, then broadcast. */
  function mutate<T>(fn: (draft: InventorySnapshot) => T): Promise<T> {
    return withLock(() => {
      const draft = read();
      const result = fn(draft);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      channel?.postMessage("changed");
      notify();
      return result;
    });
  }

  return {
    kind: "local",
    requiresAuth: false,

    async load() {
      ensureChannel();
      return read();
    },

    subscribe(onChange) {
      ensureChannel();
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },

    adjust(sku, delta) {
      return mutate((s) => {
        s.levels[sku] = Math.max(0, (s.levels[sku] ?? 0) + Math.trunc(delta));
      });
    },

    setLevel(sku, onHand) {
      return mutate((s) => {
        s.levels[sku] = Math.max(0, Math.trunc(onHand));
      });
    },

    updateSettings(patch) {
      return mutate((s) => {
        s.settings = { ...s.settings, ...patch };
      });
    },

    async placeOrder({ lines, customer, delivery, payment }) {
      // Simulated payment authorisation, so checkout feels like the real thing.
      await new Promise((r) => setTimeout(r, 900));
      return mutate((s) => {
        // Merge duplicate SKUs before checking stock.
        const wanted = new Map<string, number>();
        for (const l of lines) wanted.set(l.sku, (wanted.get(l.sku) ?? 0) + l.quantity);

        const conflicts: StockConflict[] = [];
        const priced = [...wanted].map(([sku, quantity]) => {
          const line = priceLine(sku, quantity);
          const available = line ? s.levels[sku] ?? 0 : 0;
          if (!line || quantity > available) {
            conflicts.push({ sku, title: line ? `${line.title}, ${line.colourName}, ${line.size}` : "Unavailable piece", requested: quantity, available });
          }
          return line;
        });
        if (conflicts.length > 0) {
          return { ok: false as const, conflicts, message: "Some pieces sold out while you were checking out." };
        }

        const orderLines = priced.map((line) => {
          s.levels[line!.sku] -= line!.quantity;
          return line!;
        });
        const subtotal = orderLines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
        const fee = deliveryFee(delivery);
        const order: StoreOrder = {
          id: crypto.randomUUID(),
          reference: orderReference(),
          createdAt: new Date().toISOString(),
          customer,
          delivery,
          payment,
          lines: orderLines,
          subtotal,
          deliveryFee: fee,
          total: subtotal + fee,
          currency: "RWF",
        };
        s.orders = [order, ...s.orders].slice(0, MAX_ORDERS);
        return { ok: true as const, order };
      });
    },

    async getSession() {
      return { email: "demo (this browser)" };
    },
    async signIn() {},
    async signOut() {},
    onAuthChange() {
      return () => {};
    },

    resetDemo() {
      return mutate((s) => {
        Object.assign(s, seedSnapshot());
      });
    },
  };
}
