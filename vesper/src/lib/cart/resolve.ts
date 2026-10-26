import { PRODUCTS } from "@/lib/commerce/sample-data";
import type { Colorway, Money, Product } from "@/lib/commerce/types";
import type { BagLine } from "./store";

export interface ResolvedLine {
  index: number;
  line: BagLine;
  product: Product;
  colorway: Colorway;
  lineTotal: Money;
}

/** Joins bag lines with catalogue data, dropping lines whose product no longer exists. */
export function resolveLines(lines: BagLine[]): ResolvedLine[] {
  return lines.flatMap((line, index) => {
    const product = PRODUCTS.find((p) => p.slug === line.slug);
    const colorway = product?.colorways.find((c) => c.id === line.colorwayId);
    if (!product || !colorway) return [];
    return [{ index, line, product, colorway, lineTotal: { ...product.price, amount: product.price.amount * line.quantity } }];
  });
}

export function subtotal(lines: ResolvedLine[]): Money {
  return {
    amount: lines.reduce((sum, l) => sum + l.lineTotal.amount, 0),
    currencyCode: lines[0]?.product.price.currencyCode ?? "RWF",
  };
}
