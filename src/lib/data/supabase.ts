import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SETTINGS } from "../seed";
import type {
  Category,
  CategoryInput,
  Order,
  PlaceOrderResult,
  Product,
  ProductInput,
  StoreSettings,
} from "../types";
import type { AdminSession, StoreRepository } from "./repository";

/* Row shapes as stored in Postgres (snake_case). */
interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  visible: boolean;
  sort_order: number;
}
interface ProductRow {
  id: string;
  sku: string;
  title: string;
  description: string;
  category_id: string;
  price: number | string;
  stock: number;
  visible: boolean;
  featured: boolean;
  image_url: string | null;
  accent: Product["accent"];
  created_at: string;
  updated_at: string;
}
interface SettingsRow {
  store_name: string;
  hero_eyebrow: string;
  hero_title: string;
  hero_subtitle: string;
  currency: string;
  low_stock_threshold: number;
}
interface OrderRow {
  id: string;
  reference: string;
  customer: Order["customer"];
  payment_method: Order["paymentMethod"];
  total: number | string;
  created_at: string;
  order_items: { product_id: string | null; title: string; unit_price: number | string; quantity: number }[];
}

const toCategory = (r: CategoryRow): Category => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  visible: r.visible,
  sortOrder: r.sort_order,
});

const fromCategory = (c: Partial<CategoryInput>) =>
  stripUndefined({ name: c.name, slug: c.slug, visible: c.visible, sort_order: c.sortOrder });

const toProduct = (r: ProductRow): Product => ({
  id: r.id,
  sku: r.sku,
  title: r.title,
  description: r.description,
  categoryId: r.category_id,
  price: Number(r.price),
  stock: r.stock,
  visible: r.visible,
  featured: r.featured,
  imageUrl: r.image_url,
  accent: r.accent,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const fromProduct = (p: Partial<ProductInput>) =>
  stripUndefined({
    sku: p.sku,
    title: p.title,
    description: p.description,
    category_id: p.categoryId,
    price: p.price,
    stock: p.stock,
    visible: p.visible,
    featured: p.featured,
    image_url: p.imageUrl,
    accent: p.accent,
  });

const toSettings = (r: SettingsRow | null): StoreSettings =>
  r
    ? {
        storeName: r.store_name,
        heroEyebrow: r.hero_eyebrow,
        heroTitle: r.hero_title,
        heroSubtitle: r.hero_subtitle,
        currency: r.currency,
        lowStockThreshold: r.low_stock_threshold,
      }
    : DEFAULT_SETTINGS;

const fromSettings = (s: Partial<StoreSettings>) =>
  stripUndefined({
    store_name: s.storeName,
    hero_eyebrow: s.heroEyebrow,
    hero_title: s.heroTitle,
    hero_subtitle: s.heroSubtitle,
    currency: s.currency,
    low_stock_threshold: s.lowStockThreshold,
  });

const toOrder = (r: OrderRow): Order => ({
  id: r.id,
  reference: r.reference,
  customer: r.customer,
  paymentMethod: r.payment_method,
  total: Number(r.total),
  createdAt: r.created_at,
  lines: r.order_items.map((i) => ({
    productId: i.product_id ?? "",
    title: i.title,
    unitPrice: Number(i.unit_price),
    quantity: i.quantity,
  })),
});

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export function createSupabaseRepository(url: string, anonKey: string): StoreRepository {
  const db: SupabaseClient = createClient(url, anonKey);

  return {
    kind: "supabase",
    requiresAuth: true,

    async load() {
      const [categories, products, settings, session] = await Promise.all([
        db.from("categories").select("*").order("sort_order"),
        db.from("products").select("*").order("created_at", { ascending: false }),
        db.from("store_settings").select("*").eq("id", 1).maybeSingle(),
        db.auth.getSession(),
      ]);

      // Orders are admin-only (RLS); anonymous shoppers simply get none.
      let orders: Order[] = [];
      if (session.data.session) {
        const res = await db
          .from("orders")
          .select("*, order_items(*)")
          .order("created_at", { ascending: false })
          .limit(100);
        if (!res.error) orders = (res.data as OrderRow[]).map(toOrder);
      }

      return {
        categories: (check(categories) as CategoryRow[]).map(toCategory),
        products: (check(products) as ProductRow[]).map(toProduct),
        settings: toSettings(check(settings) as SettingsRow | null),
        orders,
      };
    },

    subscribe(onChange) {
      // Coalesce bursts (an order touches several rows) into one reload.
      let timer: ReturnType<typeof setTimeout> | undefined;
      const schedule = () => {
        clearTimeout(timer);
        timer = setTimeout(onChange, 150);
      };
      const channel = db.channel(`store-${Math.random().toString(36).slice(2)}`);
      for (const table of ["products", "categories", "store_settings", "orders"]) {
        channel.on("postgres_changes", { event: "*", schema: "public", table }, schedule);
      }
      channel.subscribe();
      return () => {
        clearTimeout(timer);
        void db.removeChannel(channel);
      };
    },

    async createProduct(input) {
      const row = check(await db.from("products").insert(fromProduct(input)).select().single());
      return toProduct(row as ProductRow);
    },
    async updateProduct(id, patch) {
      check(await db.from("products").update(fromProduct(patch)).eq("id", id));
    },
    async deleteProduct(id) {
      check(await db.from("products").delete().eq("id", id));
    },
    async adjustStock(id, delta) {
      check(await db.rpc("adjust_stock", { p_product_id: id, p_delta: delta }));
    },

    async createCategory(input) {
      const row = check(await db.from("categories").insert(fromCategory(input)).select().single());
      return toCategory(row as CategoryRow);
    },
    async updateCategory(id, patch) {
      check(await db.from("categories").update(fromCategory(patch)).eq("id", id));
    },
    async deleteCategory(id) {
      const res = await db.from("categories").delete().eq("id", id);
      if (res.error?.code === "23503") {
        throw new Error("Move or delete the products in this category first.");
      }
      check(res);
    },

    async updateSettings(patch) {
      check(await db.from("store_settings").update(fromSettings(patch)).eq("id", 1));
    },

    async placeOrder(lines, customer, paymentMethod) {
      const res = await db.rpc("place_order", {
        p_lines: lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })),
        p_customer: customer,
        p_payment_method: paymentMethod,
      });
      const data = check(res) as PlaceOrderResult;
      if (data.ok) {
        data.order.total = Number(data.order.total);
        data.order.lines = data.order.lines.map((l) => ({ ...l, unitPrice: Number(l.unitPrice) }));
      }
      return data;
    },

    async getSession() {
      const { data } = await db.auth.getSession();
      return data.session ? { email: data.session.user.email ?? "admin" } : null;
    },
    async signIn(email, password) {
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
    },
    async signOut() {
      await db.auth.signOut();
    },
    onAuthChange(cb) {
      const { data } = db.auth.onAuthStateChange((_event, session) => {
        const s: AdminSession | null = session ? { email: session.user.email ?? "admin" } : null;
        cb(s);
      });
      return () => data.subscription.unsubscribe();
    },
  };
}
