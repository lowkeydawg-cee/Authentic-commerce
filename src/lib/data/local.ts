import { DEFAULT_SETTINGS, SEED_CATEGORIES, SEED_PRODUCTS } from "../seed";
import { orderReference, uid } from "../format";
import type { Order, StockConflict, StoreSnapshot } from "../types";
import type { StoreRepository } from "./repository";

const STORAGE_KEY = "authentic-commerce:store:v1";
const CHANNEL = "authentic-commerce:sync";
const MAX_ORDERS = 100;

function seedSnapshot(): StoreSnapshot {
  return {
    products: structuredClone(SEED_PRODUCTS),
    categories: structuredClone(SEED_CATEGORIES),
    settings: { ...DEFAULT_SETTINGS },
    orders: [],
  };
}

function read(): StoreSnapshot {
  if (typeof window === "undefined") return seedSnapshot();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedSnapshot();
    const parsed = JSON.parse(raw) as StoreSnapshot;
    return { ...seedSnapshot(), ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
  } catch {
    return seedSnapshot();
  }
}

/**
 * Browser-only backend: localStorage for persistence, BroadcastChannel and the
 * `storage` event for real-time sync between tabs (storefront ↔ admin), and the
 * Web Locks API so two tabs can never oversell the same unit.
 */
export function createLocalRepository(): StoreRepository {
  const listeners = new Set<() => void>();
  let channel: BroadcastChannel | null = null;

  const notify = () => listeners.forEach((l) => l());

  let listening = false;
  function ensureChannel() {
    if (listening || typeof window === "undefined") return;
    listening = true;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(CHANNEL);
      channel.onmessage = notify;
    } else {
      // Fallback for older browsers: the storage event fires in *other* tabs.
      window.addEventListener("storage", (e) => {
        if (e.key === STORAGE_KEY) notify();
      });
    }
  }

  async function withLock<T>(fn: () => T): Promise<T> {
    if (typeof navigator !== "undefined" && navigator.locks) {
      return navigator.locks.request(STORAGE_KEY, async () => fn());
    }
    return fn();
  }

  /** Read-modify-write against the *latest* stored state, then broadcast. */
  function mutate<T>(fn: (draft: StoreSnapshot) => T): Promise<T> {
    return withLock(() => {
      const draft = read();
      const result = fn(draft);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      channel?.postMessage("changed");
      notify();
      return result;
    });
  }

  const stamp = () => new Date().toISOString();

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

    createProduct(input) {
      return mutate((s) => {
        const product = { ...input, id: uid("prd"), createdAt: stamp(), updatedAt: stamp() };
        s.products.unshift(product);
        return product;
      });
    },

    updateProduct(id, patch) {
      return mutate((s) => {
        s.products = s.products.map((p) =>
          p.id === id ? { ...p, ...patch, updatedAt: stamp() } : p,
        );
      });
    },

    deleteProduct(id) {
      return mutate((s) => {
        s.products = s.products.filter((p) => p.id !== id);
      });
    },

    adjustStock(id, delta) {
      return mutate((s) => {
        s.products = s.products.map((p) =>
          p.id === id ? { ...p, stock: Math.max(0, p.stock + delta), updatedAt: stamp() } : p,
        );
      });
    },

    createCategory(input) {
      return mutate((s) => {
        const category = { ...input, id: uid("cat") };
        s.categories.push(category);
        return category;
      });
    },

    updateCategory(id, patch) {
      return mutate((s) => {
        s.categories = s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c));
      });
    },

    deleteCategory(id) {
      return mutate((s) => {
        if (s.products.some((p) => p.categoryId === id)) {
          throw new Error("Move or delete the products in this category first.");
        }
        s.categories = s.categories.filter((c) => c.id !== id);
      });
    },

    updateSettings(patch) {
      return mutate((s) => {
        s.settings = { ...s.settings, ...patch };
      });
    },

    async placeOrder(lines, customer, paymentMethod) {
      // Simulate payment-gateway latency so the checkout animation has room to breathe.
      await new Promise((r) => setTimeout(r, 900));
      return mutate((s) => {
        const conflicts: StockConflict[] = [];
        for (const line of lines) {
          const product = s.products.find((p) => p.id === line.productId);
          const available = product && product.visible ? product.stock : 0;
          if (!product || line.quantity > available) {
            conflicts.push({
              productId: line.productId,
              title: product?.title ?? "Unavailable item",
              requested: line.quantity,
              available,
            });
          }
        }
        if (conflicts.length > 0) {
          return {
            ok: false as const,
            conflicts,
            message: "Some items sold out while you were checking out.",
          };
        }

        const orderLines = lines.map((line) => {
          const product = s.products.find((p) => p.id === line.productId)!;
          product.stock -= line.quantity;
          product.updatedAt = stamp();
          return { ...line, title: product.title, unitPrice: product.price };
        });
        const order: Order = {
          id: uid("ord"),
          reference: orderReference(),
          customer,
          paymentMethod,
          lines: orderLines,
          total: orderLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
          createdAt: stamp(),
        };
        s.orders = [order, ...s.orders].slice(0, MAX_ORDERS);
        return { ok: true as const, order };
      });
    },

    async getSession() {
      return { email: "demo@local" };
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
