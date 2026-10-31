import { createLocalRepository } from "./local";
import type { InventoryRepository } from "./repository";

let instance: Promise<InventoryRepository> | null = null;

/** Which backend this build uses. Set NEXT_PUBLIC_INVENTORY_PROVIDER=supabase (plus URL and anon key) for production. */
export const INVENTORY_PROVIDER = process.env.NEXT_PUBLIC_INVENTORY_PROVIDER === "supabase" ? "supabase" : "local";

/**
 * The inventory backend (browser only). The Supabase client is imported on
 * demand, so the default browser-storage build never ships it.
 */
export function getInventory(): Promise<InventoryRepository> {
  if (instance) return instance;
  if (INVENTORY_PROVIDER === "supabase") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return Promise.reject(new Error("NEXT_PUBLIC_INVENTORY_PROVIDER=supabase needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."));
    }
    instance = import("./supabase").then((m) => m.createSupabaseRepository(url, key));
  } else {
    instance = Promise.resolve(createLocalRepository());
  }
  return instance;
}

export type { InventoryRepository, AdminSession } from "./repository";
export * from "./types";
