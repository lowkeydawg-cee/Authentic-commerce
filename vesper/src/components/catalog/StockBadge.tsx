"use client";

import { useStock } from "@/lib/inventory/live";

/** Live "Sold out" / "Low stock" badge for a product card (every colour and size of the product). */
export function StockBadge({ skus }: { skus: string[] }) {
  const stock = useStock();
  const statuses = skus.map((s) => stock.status(s));
  const label = statuses.every((s) => s === "out") ? "Sold out" : statuses.every((s) => s !== "healthy") ? "Low stock" : null;
  if (!label) return null;
  return <span className="label pointer-events-none absolute right-4 top-4 bg-ink/70 px-2.5 py-1 text-mist backdrop-blur-sm">{label}</span>;
}
