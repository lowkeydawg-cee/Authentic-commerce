"use client";

import Link from "next/link";
import { resolveLines, subtotal } from "@/lib/cart/resolve";
import { useBag } from "@/lib/cart/store";
import { formatMoney } from "@/lib/format";
import { BagLines } from "./BagLines";

export function BagView() {
  const lines = resolveLines(useBag());
  const count = lines.reduce((n, l) => n + l.line.quantity, 0);
  return (
    <div className="page-x mx-auto max-w-page pb-24 pt-[calc(var(--header-h)+56px)]">
      <h1 className="font-display text-[clamp(44px,6vw,88px)] leading-none">Your bag</h1>
      {lines.length === 0 ? (
        <div className="mt-12 flex flex-col items-start gap-5 border-t border-line pt-10">
          <p className="font-display text-3xl">Your bag is empty.</p>
          <p className="text-mist">Pieces you add will wait here.</p>
          <Link href="/collections" className="label inline-flex min-h-12 items-center bg-ivory px-8 font-semibold text-ink hover:bg-white">
            Discover the collection
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] lg:items-start">
          <section aria-label={`${count} ${count === 1 ? "item" : "items"} in your bag`}>
            <BagLines lines={lines} />
          </section>
          <aside aria-labelledby="summary-title" className="border border-line p-6 lg:sticky lg:top-[calc(var(--header-h)+24px)]">
            <h2 id="summary-title" className="label text-mist">
              Order summary
            </h2>
            <dl className="mt-6 space-y-3 text-[15px]">
              <div className="flex justify-between">
                <dt className="text-mist">Subtotal</dt>
                <dd className="tabular-nums">{formatMoney(subtotal(lines))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-mist">Delivery</dt>
                <dd>Complimentary</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-4 text-lg">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatMoney(subtotal(lines))}</dd>
              </div>
            </dl>
            <Link href="/checkout" className="label mt-8 flex min-h-14 items-center justify-center bg-ivory font-semibold text-ink hover:bg-white">
              Checkout
            </Link>
            <p className="mt-4 text-sm text-smoke">Free returns within 30 days. Taxes included.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
