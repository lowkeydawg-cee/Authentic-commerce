import { createClient } from "@supabase/supabase-js";
import { DEFAULT_SETTINGS } from "./seed";
import type { AdminSession, InventoryRepository } from "./repository";
import type { CustomerDetails, DeliveryId, PaymentId, PlaceOrderResult, StockConflict, StoreOrder } from "./types";

/* Row shapes as stored in Postgres (see supabase/schema.sql). */
interface OrderRow {
  id: string;
  reference: string;
  created_at: string;
  customer: CustomerDetails;
  delivery: DeliveryId;
  payment: PaymentId;
  subtotal: number | string;
  delivery_fee: number | string;
  total: number | string;
  currency: string;
  order_items: {
    sku: string;
    product_slug: string;
    colorway_id: string;
    size: string;
    title: string;
    colour_name: string;
    unit_price: number | string;
    quantity: number;
  }[];
}

const toOrder = (r: OrderRow): StoreOrder => ({
  id: r.id,
  reference: r.reference,
  createdAt: r.created_at,
  customer: r.customer,
  delivery: r.delivery,
  payment: r.payment,
  subtotal: Number(r.subtotal),
  deliveryFee: Number(r.delivery_fee),
  total: Number(r.total),
  currency: r.currency,
  lines: r.order_items.map((i) => ({
    sku: i.sku,
    slug: i.product_slug,
    colorwayId: i.colorway_id,
    size: i.size,
    title: i.title,
    colourName: i.colour_name,
    unitPrice: Number(i.unit_price),
    quantity: i.quantity,
  })),
});

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

/**
 * Production backend: Postgres holds stock, orders and settings; Realtime
 * pushes every change to all shoppers and admins; checkout runs through the
 * `place_order` function, which locks the rows and decrements in one
 * transaction; Row Level Security limits writes to signed-in admins.
 */
export function createSupabaseRepository(url: string, anonKey: string): InventoryRepository {
  const db = createClient(url, anonKey);

  return {
    kind: "supabase",
    requiresAuth: true,

    async load() {
      const [levels, settings, orders] = await Promise.all([
        db.from("inventory").select("sku, on_hand"),
        db.from("store_settings").select("low_stock_threshold").maybeSingle(),
        // Returns no rows for shoppers: Row Level Security limits orders to admins.
        db.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(200),
      ]);
      const rows = check(levels) as { sku: string; on_hand: number }[];
      const s = check(settings) as { low_stock_threshold: number } | null;
      return {
        levels: Object.fromEntries(rows.map((r) => [r.sku, r.on_hand])),
        settings: s ? { lowStockThreshold: s.low_stock_threshold } : DEFAULT_SETTINGS,
        orders: ((orders.data ?? []) as OrderRow[]).map(toOrder),
      };
    },

    subscribe(onChange) {
      // Coalesce bursts (an order touches several rows) into one reload.
      let timer: ReturnType<typeof setTimeout> | undefined;
      const changed = () => {
        clearTimeout(timer);
        timer = setTimeout(onChange, 120);
      };
      const channel = db
        .channel("vesper-inventory")
        .on("postgres_changes", { event: "*", schema: "public", table: "inventory" }, changed)
        .on("postgres_changes", { event: "*", schema: "public", table: "store_settings" }, changed)
        .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, changed)
        .subscribe();
      return () => {
        clearTimeout(timer);
        db.removeChannel(channel);
      };
    },

    async adjust(sku, delta) {
      check(await db.rpc("adjust_stock", { p_sku: sku, p_delta: Math.trunc(delta) }));
    },

    async setLevel(sku, onHand) {
      check(await db.rpc("set_stock", { p_sku: sku, p_on_hand: Math.max(0, Math.trunc(onHand)) }));
    },

    async updateSettings(patch) {
      if (patch.lowStockThreshold === undefined) return;
      check(await db.from("store_settings").update({ low_stock_threshold: patch.lowStockThreshold }).eq("id", 1));
    },

    async placeOrder({ lines, customer, delivery, payment }): Promise<PlaceOrderResult> {
      const res = check(
        await db.rpc("place_order", { p_lines: lines, p_customer: customer, p_delivery: delivery, p_payment: payment }),
      ) as { ok: true; order: OrderRow } | { ok: false; conflicts: StockConflict[]; message: string };
      return res.ok ? { ok: true, order: toOrder(res.order) } : res;
    },

    async getSession() {
      const { data } = await db.auth.getSession();
      const user = data.session?.user;
      return user ? ({ email: user.email ?? "admin" } satisfies AdminSession) : null;
    },
    async signIn(email, password) {
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
    },
    async signOut() {
      await db.auth.signOut();
    },
    onAuthChange(cb) {
      const { data } = db.auth.onAuthStateChange((_e, session) => cb(session?.user ? { email: session.user.email ?? "admin" } : null));
      return () => data.subscription.unsubscribe();
    },
  };
}
