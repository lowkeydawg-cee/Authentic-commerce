export type StockStatus = "healthy" | "low" | "out";

export function stockStatus(stock: number, lowThreshold: number): StockStatus {
  if (stock <= 0) return "out";
  if (stock <= lowThreshold) return "low";
  return "healthy";
}

export function stockLabel(stock: number, lowThreshold: number): string {
  const status = stockStatus(stock, lowThreshold);
  if (status === "out") return "Out of Stock";
  if (status === "low") return `Only ${stock} left`;
  return "In Stock";
}

export const STATUS_STYLES: Record<StockStatus, { dot: string; chip: string; label: string }> = {
  healthy: {
    dot: "bg-emerald-400",
    chip: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30",
    label: "Healthy",
  },
  low: {
    dot: "bg-amber-400",
    chip: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
    label: "Low stock",
  },
  out: {
    dot: "bg-rose-500",
    chip: "bg-rose-500/10 text-rose-300 ring-rose-500/30",
    label: "Out of stock",
  },
};
