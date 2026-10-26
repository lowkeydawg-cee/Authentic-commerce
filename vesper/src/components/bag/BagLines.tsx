"use client";

import Link from "next/link";
import clsx from "clsx";
import { ProductImage } from "@/components/media/ProductImage";
import { bag } from "@/lib/cart/store";
import type { ResolvedLine } from "@/lib/cart/resolve";
import { formatMoney } from "@/lib/format";

const MAX_QTY = 10;

export function BagLines({ lines, compact, readOnly, onNavigate }: { lines: ResolvedLine[]; compact?: boolean; readOnly?: boolean; onNavigate?: () => void }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {lines.map(({ index, line, product, colorway, lineTotal }) => {
        const href = `/products/${product.slug}?colour=${colorway.id}`;
        const sizeText = product.sizeLabel === "One size" ? "One size" : `${product.sizeLabel === "EU" ? "EU " : "Size "}${line.size}`;
        return (
          <li key={`${line.slug}-${line.colorwayId}-${line.size}`} className={clsx("flex gap-4", compact ? "py-4" : "py-6 sm:gap-6")}>
            <Link href={href} onClick={onNavigate} className={clsx("relative shrink-0", compact ? "h-24 w-20" : "h-32 w-28 sm:h-40 sm:w-32")}>
              <ProductImage src={colorway.images.front} alt={`${product.title} in ${colorway.name}`} sizes="128px" className="absolute inset-0" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link href={href} onClick={onNavigate} className={clsx("font-display link-draw", compact ? "text-lg" : "text-xl sm:text-2xl")}>
                    {product.title}
                  </Link>
                  <p className="mt-1 text-sm text-mist">
                    {colorway.name} · {sizeText}
                    {readOnly && ` · Qty ${line.quantity}`}
                  </p>
                </div>
                <p className="shrink-0 text-[15px] tabular-nums">{formatMoney(lineTotal)}</p>
              </div>
              {!readOnly && (
                <div className="mt-auto flex items-center justify-between gap-4 pt-3">
                  <div className="flex items-center border border-line" role="group" aria-label={`Quantity of ${product.title}`}>
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${product.title}`}
                      onClick={() => bag.setQuantity(index, line.quantity - 1)}
                      className="grid h-11 w-11 place-items-center text-lg text-mist hover:text-ivory"
                    >
                      −
                    </button>
                    <span aria-live="polite" className="w-8 text-center text-sm tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${product.title}`}
                      disabled={line.quantity >= MAX_QTY}
                      onClick={() => bag.setQuantity(index, line.quantity + 1)}
                      className="grid h-11 w-11 place-items-center text-lg text-mist hover:text-ivory disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <button type="button" onClick={() => bag.setQuantity(index, 0)} className="label link-draw min-h-11 text-smoke hover:text-ivory">
                    Remove <span className="sr-only">{product.title}</span>
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
