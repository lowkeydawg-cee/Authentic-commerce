import type {
  Category,
  CategoryInput,
  CustomerDetails,
  OrderLine,
  PaymentMethod,
  PlaceOrderResult,
  Product,
  ProductInput,
  StoreSettings,
  StoreSnapshot,
} from "../types";

export interface AdminSession {
  email: string;
}

/**
 * Single contract every storage backend implements. UI code only talks to
 * this interface, so swapping localStorage for Supabase (or anything else)
 * never touches a component.
 */
export interface StoreRepository {
  readonly kind: "local" | "supabase";
  /** Whether the admin dashboard must sign in before it can write. */
  readonly requiresAuth: boolean;

  load(): Promise<StoreSnapshot>;
  /** Calls `onChange` whenever data changes anywhere (other tabs, other users). */
  subscribe(onChange: () => void): () => void;

  createProduct(input: ProductInput): Promise<Product>;
  updateProduct(id: string, patch: Partial<ProductInput>): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  /** Atomically add `delta` (may be negative) to stock, clamped at zero. */
  adjustStock(id: string, delta: number): Promise<void>;

  createCategory(input: CategoryInput): Promise<Category>;
  updateCategory(id: string, patch: Partial<CategoryInput>): Promise<void>;
  deleteCategory(id: string): Promise<void>;

  updateSettings(patch: Partial<StoreSettings>): Promise<void>;

  /** Validates stock and decrements it in one atomic step. */
  placeOrder(
    lines: OrderLine[],
    customer: CustomerDetails,
    paymentMethod: PaymentMethod,
  ): Promise<PlaceOrderResult>;

  getSession(): Promise<AdminSession | null>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  onAuthChange(cb: (session: AdminSession | null) => void): () => void;

  /** Restore the demo catalog. Only meaningful for the local provider. */
  resetDemo?(): Promise<void>;
}
