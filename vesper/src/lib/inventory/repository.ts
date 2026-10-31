import type { InventorySettings, InventorySnapshot, PlaceOrderInput, PlaceOrderResult } from "./types";

export interface AdminSession {
  email: string;
}

/**
 * The contract every inventory backend implements. The storefront and the
 * admin only talk to this, so browser storage and Supabase are interchangeable.
 */
export interface InventoryRepository {
  readonly kind: "local" | "supabase";
  /** Whether the admin must sign in before it can change stock. */
  readonly requiresAuth: boolean;

  load(): Promise<InventorySnapshot>;
  /** Calls `onChange` whenever stock, settings or orders change anywhere (other tabs, other devices). */
  subscribe(onChange: () => void): () => void;

  /** Atomically add `delta` (may be negative) to a variant's stock, never below zero. */
  adjust(sku: string, delta: number): Promise<void>;
  /** Set a variant's stock to an exact count (a stock take). */
  setLevel(sku: string, onHand: number): Promise<void>;
  updateSettings(patch: Partial<InventorySettings>): Promise<void>;

  /** Checks stock and decrements it in one atomic step; prices come from the backend, not the client. */
  placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult>;

  getSession(): Promise<AdminSession | null>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  onAuthChange(cb: (session: AdminSession | null) => void): () => void;

  /** Restore the opening demo stock and clear orders. Local backend only. */
  resetDemo?(): Promise<void>;
}
