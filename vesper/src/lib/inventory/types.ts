/**
 * Inventory domain. Stock is held per variant (product × colourway × size),
 * keyed by SKU. Catalogue content (titles, images, 3D) stays in the commerce
 * layer; only quantities, the low-stock threshold and orders live here.
 */
import type { DELIVERY, PAYMENT } from "@/lib/delivery";

export type DeliveryId = (typeof DELIVERY)[number]["id"];
export type PaymentId = (typeof PAYMENT)[number]["id"];

export const skuOf = (slug: string, colorwayId: string, size: string) => `${slug}:${colorwayId}:${size}`;

export function parseSku(sku: string) {
  const [slug, colorwayId, size] = sku.split(":");
  return { slug, colorwayId, size };
}

export interface InventorySettings {
  /** At or below this many units a variant shows "Only N left" and counts as low stock. */
  lowStockThreshold: number;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

export interface OrderLineInput {
  sku: string;
  quantity: number;
}

export interface StoreOrderLine {
  sku: string;
  slug: string;
  colorwayId: string;
  size: string;
  title: string;
  colourName: string;
  unitPrice: number;
  quantity: number;
}

export interface StoreOrder {
  id: string;
  reference: string;
  createdAt: string;
  customer: CustomerDetails;
  delivery: DeliveryId;
  payment: PaymentId;
  lines: StoreOrderLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
}

export interface StockConflict {
  sku: string;
  title: string;
  requested: number;
  available: number;
}

export type PlaceOrderResult =
  | { ok: true; order: StoreOrder }
  | { ok: false; conflicts: StockConflict[]; message: string };

export interface PlaceOrderInput {
  lines: OrderLineInput[];
  customer: CustomerDetails;
  delivery: DeliveryId;
  payment: PaymentId;
}

export interface InventorySnapshot {
  /** Units on hand by SKU. A SKU missing from the map has no stock record (treated as 0). */
  levels: Record<string, number>;
  settings: InventorySettings;
  /** Newest first. Only visible to admins on the Supabase backend. */
  orders: StoreOrder[];
}

export type StockStatus = "healthy" | "low" | "out";

export function stockStatus(onHand: number, lowThreshold: number): StockStatus {
  if (onHand <= 0) return "out";
  if (onHand <= lowThreshold) return "low";
  return "healthy";
}

export function orderReference() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
  return `VSP-${n}`;
}
