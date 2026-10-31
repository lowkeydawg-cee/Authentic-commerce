import { PRODUCTS } from "@/lib/commerce/sample-data";
import { DELIVERY } from "@/lib/delivery";
import { parseSku, type DeliveryId, type StoreOrderLine } from "./types";

/** Resolves a SKU to its catalogue product and colourway, or null if it no longer exists. */
export function lookupSku(sku: string) {
  const { slug, colorwayId, size } = parseSku(sku);
  const product = PRODUCTS.find((p) => p.slug === slug);
  const colorway = product?.colorways.find((c) => c.id === colorwayId);
  if (!product || !colorway || !product.sizes.includes(size)) return null;
  return { product, colorway, size };
}

/** Prices order lines from the catalogue (never from the client's bag). Used by the local backend. */
export function priceLine(sku: string, quantity: number): StoreOrderLine | null {
  const hit = lookupSku(sku);
  if (!hit) return null;
  return {
    sku,
    slug: hit.product.slug,
    colorwayId: hit.colorway.id,
    size: hit.size,
    title: hit.product.title,
    colourName: hit.colorway.name,
    unitPrice: hit.product.price.amount,
    quantity,
  };
}

export function deliveryFee(id: DeliveryId) {
  return DELIVERY.find((d) => d.id === id)?.fee ?? 0;
}
