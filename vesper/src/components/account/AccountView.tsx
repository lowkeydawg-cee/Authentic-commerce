"use client";

import Link from "next/link";
import clsx from "clsx";
import { useId, useState, useSyncExternalStore } from "react";
import { BagLines } from "@/components/bag/BagLines";
import { clearOrders, useOrders, type DemoOrder } from "@/lib/cart/orders";
import { resolveLines } from "@/lib/cart/resolve";
import { formatDate, formatMoney } from "@/lib/format";
import { site } from "@/content/site";

const hydrated = () => true;
const noop = () => () => {};

/**
 * Account (prototype): lists the orders placed in this browser and lets a
 * customer look one up by reference and email. Sign-in, saved addresses and
 * order history across devices come with the commerce platform.
 */
export function AccountView() {
  const orders = useOrders();
  // Orders live in localStorage, so render the list only after hydration.
  const ready = useSyncExternalStore(noop, hydrated, () => false);

  return (
    <div className="grid gap-16 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)] lg:items-start">
      <section aria-labelledby="orders-title">
        <h2 id="orders-title" className="font-display text-3xl sm:text-4xl">
          Your orders
        </h2>
        {!ready ? (
          <div className="mt-8 h-40 border-y border-line" aria-hidden="true" />
        ) : orders.length === 0 ? (
          <div className="mt-8 border-y border-line py-12">
            <p className="text-[17px] text-mist">No orders on this device yet.</p>
            <Link href="/collections" className="label link-draw tap mt-4">
              Explore the collection
            </Link>
          </div>
        ) : (
          <>
            <ul className="mt-8 space-y-6">
              {orders.map((o, i) => (
                <li key={o.reference}>
                  <Order order={o} open={i === 0} />
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => window.confirm("Remove all orders from this device? This can't be undone.") && clearOrders()}
              className="label link-draw tap mt-8 text-smoke hover:text-ivory"
            >
              Remove orders from this device
            </button>
          </>
        )}
      </section>

      <aside className="space-y-12">
        <Lookup orders={orders} />
        <section aria-labelledby="help-title" className="border-t border-line pt-8">
          <h2 id="help-title" className="label text-smoke">
            Need help with an order?
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-mist">
            Write to <a href={`mailto:${site.email}`} className="link-draw text-ivory">{site.email}</a> with your reference. {site.responseTime}
          </p>
          <Link href="/shipping-returns#returns" className="label link-draw tap mt-3">
            Returns &amp; exchanges
          </Link>
        </section>
      </aside>
    </div>
  );
}

function Order({ order, open }: { order: DemoOrder; open: boolean }) {
  const lines = resolveLines(order.lines);
  const count = order.lines.reduce((n, l) => n + l.quantity, 0);
  return (
    <details open={open} className="group border border-line">
      <summary className="flex min-h-16 cursor-pointer list-none flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block tabular-nums text-ivory">{order.reference}</span>
          <span className="block text-sm text-mist">
            {formatDate(order.createdAt)} · {count} {count === 1 ? "piece" : "pieces"}
          </span>
        </span>
        <span className="flex items-center gap-4">
          <span className="tabular-nums">{formatMoney(order.total)}</span>
          <span aria-hidden="true" className="text-smoke transition-transform duration-quick group-open:rotate-180">
            ⌄
          </span>
        </span>
      </summary>
      <div className="border-t border-line px-5 py-5">
        <dl className="mb-5 grid gap-4 text-[15px] sm:grid-cols-3">
          <div><dt className="label text-smoke">Status</dt><dd className="mt-1">Confirmed (demo)</dd></div>
          <div><dt className="label text-smoke">Delivery</dt><dd className="mt-1">{order.delivery}</dd></div>
          <div><dt className="label text-smoke">Payment</dt><dd className="mt-1">{order.payment}</dd></div>
        </dl>
        <BagLines lines={lines} compact readOnly />
      </div>
    </details>
  );
}

function Lookup({ orders }: { orders: DemoOrder[] }) {
  const id = useId();
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<DemoOrder | null | "missing">(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ref = reference.trim().toUpperCase();
    const found = orders.find((o) => o.reference === ref && o.email.toLowerCase() === email.trim().toLowerCase());
    setResult(found ?? "missing");
  };
  const field = "mt-2 block min-h-12 w-full border border-line bg-transparent px-4 text-[15px] text-ivory outline-none transition-colors duration-quick focus:border-ivory";

  return (
    <section aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="font-display text-2xl">
        Find an order
      </h2>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <div>
          <label htmlFor={`${id}-ref`} className="label text-mist">Order reference</label>
          <input id={`${id}-ref`} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="VSP-…" required className={field} />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="label text-mist">Email used at checkout</label>
          <input id={`${id}-email`} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={field} />
        </div>
        <button type="submit" className="label inline-flex min-h-12 w-full items-center justify-center border border-ivory px-6 transition-colors duration-quick hover:bg-ivory hover:text-ink">
          Find order
        </button>
      </form>
      <div role="status" className={clsx("mt-5 text-[15px]", !result && "sr-only")}>
        {result === "missing" && <p className="text-mist">We couldn&apos;t find that order on this device. Check the reference, or write to us and we&apos;ll look it up.</p>}
        {result && result !== "missing" && (
          <p className="text-mist">
            <span className="tabular-nums text-ivory">{result.reference}</span> · {formatDate(result.createdAt)} · {formatMoney(result.total)} · Confirmed (demo)
          </p>
        )}
      </div>
    </section>
  );
}
