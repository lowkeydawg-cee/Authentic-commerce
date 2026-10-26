import clsx from "clsx";
import { STATUS_STYLES, stockLabel, stockStatus } from "@/lib/stock";

export function StockBadge({
  stock,
  lowThreshold,
  className,
}: {
  stock: number;
  lowThreshold: number;
  className?: string;
}) {
  const status = stockStatus(stock, lowThreshold);
  const style = STATUS_STYLES[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset backdrop-blur",
        style.chip,
        className,
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", style.dot, status !== "healthy" && "animate-pulse")} />
      {stockLabel(stock, lowThreshold)}
    </span>
  );
}
