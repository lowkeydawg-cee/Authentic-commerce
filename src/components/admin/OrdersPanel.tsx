"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Receipt } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useInventory } from "@/store/inventory";

const PAYMENT_LABEL = { card: "Card", mtn_momo: "MTN MoMo", airtel_money: "Airtel Money" } as const;

function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function OrdersPanel({ limit }: { limit?: number }) {
  const { orders, settings } = useInventory();
  const list = limit ? orders.slice(0, limit) : orders;

  return (
    <div className="glass rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-xl">Live orders</h3>
        <span className="text-xs text-white/40">{orders.length} total</span>
      </div>
      {list.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center text-sm text-white/40">
          <Receipt className="mb-3 h-8 w-8 text-white/20" />
          No orders yet. Place one from the storefront and watch it appear here.
        </div>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {list.map((o) => (
              <motion.li
                key={o.id}
                layout
                initial={{ opacity: 0, x: 30, backgroundColor: "rgba(52,211,153,0.15)" }}
                animate={{ opacity: 1, x: 0, backgroundColor: "rgba(255,255,255,0.02)" }}
                transition={{ duration: 0.8 }}
                className="rounded-2xl border border-white/5 p-3"
              >
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-mono text-xs text-gold-200">{o.reference}</span>
                  <span className="text-xs text-white/40">{timeAgo(o.createdAt)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="truncate text-sm">{o.customer.fullName || "Customer"}</span>
                  <span className="shrink-0 text-sm font-medium tabular-nums">{formatMoney(o.total, settings.currency)}</span>
                </div>
                <p className="mt-1 truncate text-xs text-white/40">
                  {o.lines.map((l) => `${l.quantity}× ${l.title}`).join(", ")} · {PAYMENT_LABEL[o.paymentMethod]}
                </p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
