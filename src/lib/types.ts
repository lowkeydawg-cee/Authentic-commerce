export type ProductAccent =
  | "amber"
  | "rose"
  | "emerald"
  | "sky"
  | "violet"
  | "slate";

export interface Category {
  id: string;
  name: string;
  slug: string;
  visible: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  sku: string;
  title: string;
  description: string;
  categoryId: string;
  price: number;
  stock: number;
  visible: boolean;
  featured: boolean;
  imageUrl: string | null;
  accent: ProductAccent;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  storeName: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  currency: string;
  lowStockThreshold: number;
}

export interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

export type PaymentMethod = "card" | "mtn_momo" | "airtel_money";

export interface OrderLine {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  reference: string;
  customer: CustomerDetails;
  paymentMethod: PaymentMethod;
  lines: (OrderLine & { title: string; unitPrice: number })[];
  total: number;
  createdAt: string;
}

export interface StockConflict {
  productId: string;
  title: string;
  requested: number;
  available: number;
}

export type PlaceOrderResult =
  | { ok: true; order: Order }
  | { ok: false; conflicts: StockConflict[]; message: string };

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;
export type CategoryInput = Omit<Category, "id">;

export interface StoreSnapshot {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  orders: Order[];
}
