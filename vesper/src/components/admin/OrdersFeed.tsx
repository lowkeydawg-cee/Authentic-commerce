"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { DELIVERY, PAYMENT } from "@/lib/delivery";
import type { StoreOrder } from "@/lib/inventory/types";
import { formatMoney } from "@/lib/format";

const when = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Kigali" });

/** Newest orders first; an order that arrives while the page is open glows. */
export function OrdersFeed({ orders, hidden }: { orders: StoreOrder[]; hidden: boolean }) {
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (seen.current === null) {
      seen.current = new Set(orders.map((o) => o.id));
      return;
    }
    const added = orders.filter((o) => !seen.current!.has(o.id)).map((o) => o.id);
    added.forEach((id) => seen.current!.add(id));
    if (added.length) setFresh((f) => new Set([...f, ...added]));
  }, [orders]);

  return (
    <section aria-labelledby="orders-title">
      <div className="flex items-baseline justify-between border-b border-line pb-4">
        <h2 id="orders-title" className="font-display text-3xl">
          Orders
        </h2>
        <span className="label text-smoke">{orders.length} total</span>
      </div>
      {hidden ? (
        <p className="py-8 text-sm text-mist">Sign in to see orders.</p>
      ) : orders.length === 0 ? (
        <p className="py-8 text-sm leading-relaxed text-mist">No orders yet. Each order placed in the store appears here instantly and reduces stock.</p>
      ) : (
        <ol aria-live="polite" className="max-h-[70vh] divide-y divide-line overflow-y-auto">
          {orders.slice(0, 50).map((o) => (
            <li key={o.id} className={clsx("py-4", fresh.has(o.id) && "anim-flash")}>
              <div className="flex items-baseline justify-between gap-4">
                <span className="tabular-nums text-ivory">{o.reference}</span>
                <span className="tabular-nums">{formatMoney({ amount: o.total, currencyCode: o.currency })}</span>
              </div>
              <p className="mt-1 text-sm text-mist">
                {o.customer.name} · {o.customer.city} · <time dateTime={o.createdAt}>{when.format(new Date(o.createdAt))}</time>
              </p>
              <ul className="mt-2 space-y-0.5 text-sm">
                {o.lines.map((l) => (
                  <li key={l.sku}>
                    {l.quantity} × {l.title} <span className="text-mist">· {l.colourName}{l.size !== "One size" && ` · ${l.size}`}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-smoke">
                {DELIVERY.find((d) => d.id === o.delivery)?.label} · {PAYMENT.find((p) => p.id === o.payment)?.label} · {o.customer.phone}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
