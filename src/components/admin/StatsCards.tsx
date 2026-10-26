"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { AlertTriangle, Boxes, PackageX, Wallet } from "lucide-react";
import { useEffect, useMemo } from "react";
import { formatMoney } from "@/lib/format";
import { stockStatus } from "@/lib/stock";
import { useInventory } from "@/store/inventory";

function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => format(Math.round(v)));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.8, ease: "easeOut" });
    return () => controls.stop();
  }, [mv, value]);
  return <motion.span>{text}</motion.span>;
}

export function StatsCards() {
  const { products, orders, settings } = useInventory();

  const stats = useMemo(() => {
    let units = 0;
    let value = 0;
    let low = 0;
    let out = 0;
    for (const p of products) {
      units += p.stock;
      value += p.stock * p.price;
      const s = stockStatus(p.stock, settings.lowStockThreshold);
      if (s === "low") low++;
      if (s === "out") out++;
    }
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    return { units, value, low, out, revenue };
  }, [products, orders, settings.lowStockThreshold]);

  const money = (n: number) => formatMoney(n, settings.currency);
  const cards = [
    { label: "Units in stock", value: stats.units, fmt: (n: number) => n.toLocaleString(), icon: Boxes, tint: "text-sky-300 bg-sky-400/10", sub: `${products.length} SKUs` },
    { label: "Inventory value", value: stats.value, fmt: money, icon: Wallet, tint: "text-gold-300 bg-gold-300/10", sub: `${money(stats.revenue)} revenue · ${orders.length} ${orders.length === 1 ? "order" : "orders"}` },
    { label: "Low stock alerts", value: stats.low, fmt: (n: number) => String(n), icon: AlertTriangle, tint: "text-amber-300 bg-amber-400/10", sub: `≤ ${settings.lowStockThreshold} units` },
    { label: "Out of stock", value: stats.out, fmt: (n: number) => String(n), icon: PackageX, tint: "text-rose-300 bg-rose-500/10", sub: "Cannot be purchased" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          whileHover={{ y: -4 }}
          className="glass rounded-3xl p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/50">{c.label}</p>
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${c.tint}`}>
              <c.icon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl tabular-nums">
            <AnimatedNumber value={c.value} format={c.fmt} />
          </p>
          <p className="mt-1 truncate text-xs text-white/40">{c.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}
