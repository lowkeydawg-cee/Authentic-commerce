"use client";

import Link from "next/link";
import clsx from "clsx";
import { useEffect, useId, useRef, useState } from "react";
import { ProductImage } from "@/components/media/ProductImage";
import { CATEGORIES, PRODUCTS } from "@/lib/commerce/sample-data";
import type { InventoryRepository } from "@/lib/inventory";
import { refreshInventory } from "@/lib/inventory/live";
import { skuOf, stockStatus, type InventorySnapshot, type StockStatus } from "@/lib/inventory/types";
import { formatMoney } from "@/lib/format";

type Filter = "all" | "low" | "out";

const CELL_TONE: Record<StockStatus, string> = {
  healthy: "border-line",
  low: "border-bronze/70 bg-bronze/10",
  out: "border-[#E39A9D]/60 bg-oxblood/30",
};

export function StockGrid({ repo, snapshot }: { repo: InventoryRepository; snapshot: InventorySnapshot }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState("all");
  const [problem, setProblem] = useState<string | null>(null);
  const t = snapshot.settings.lowStockThreshold;

  // Remember which counts changed since the last snapshot, so those cells can glow.
  const previous = useRef(snapshot.levels);
  const [flashes, setFlashes] = useState<Record<string, number>>({});
  useEffect(() => {
    const before = previous.current;
    previous.current = snapshot.levels;
    const changed = Object.keys(snapshot.levels).filter((k) => before[k] !== snapshot.levels[k]);
    if (changed.length) setFlashes((f) => ({ ...f, ...Object.fromEntries(changed.map((k) => [k, (f[k] ?? 0) + 1])) }));
  }, [snapshot.levels]);

  const run = async (fn: () => Promise<void>) => {
    try {
      setProblem(null);
      await fn();
      await refreshInventory();
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "That change didn't save. Try again.");
    }
  };

  const level = (sku: string) => snapshot.levels[sku] ?? 0;
  const matches = (sku: string) => filter === "all" || stockStatus(level(sku), t) === filter;
  const q = query.trim().toLowerCase();
  const products = PRODUCTS.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      (!q || p.title.toLowerCase().includes(q) || p.colorways.some((c) => c.name.toLowerCase().includes(q))) &&
      p.colorways.some((c) => p.sizes.some((s) => matches(skuOf(p.slug, c.id, s)))),
  );

  return (
    <section aria-labelledby={`${id}-title`} className="min-w-0">
      <h2 id={`${id}-title`} className="sr-only">
        Stock by product
      </h2>
      <div className="flex flex-wrap items-end gap-x-8 gap-y-5 border-b border-line pb-6">
        <div className="min-w-[220px] flex-1">
          <label htmlFor={`${id}-q`} className="label text-smoke">
            Search
          </label>
          <input
            id={`${id}-q`}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Product or colour"
            className="mt-2 block min-h-11 w-full border-b border-line bg-transparent text-[15px] text-ivory outline-none placeholder:text-smoke focus:border-ivory"
          />
        </div>
        <div>
          <label htmlFor={`${id}-cat`} className="label text-smoke">
            Category
          </label>
          <select
            id={`${id}-cat`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-2 block min-h-11 border-b border-line bg-ink pr-2 text-[15px] text-ivory outline-none focus:border-ivory"
          >
            <option value="all">All</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <fieldset>
          <legend className="label text-smoke">Show</legend>
          <div className="mt-2 flex">
            {(
              [
                ["all", "Everything"],
                ["low", "Low stock"],
                ["out", "Sold out"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="cursor-pointer">
                <input type="radio" name={`${id}-filter`} value={value} checked={filter === value} onChange={() => setFilter(value)} className="peer sr-only" />
                <span className="label flex min-h-11 items-center border border-line px-4 text-mist transition-colors duration-quick peer-checked:border-ivory peer-checked:text-ivory peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ivory [&:not(:first-child)]:-ml-px">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-mist">
        <span className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 border border-line" /> In stock</span>
        <span className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 border border-bronze/70 bg-bronze/10" /> Low ({t} or fewer)</span>
        <span className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 border border-[#E39A9D]/60 bg-oxblood/30" /> Sold out</span>
        <span className="text-smoke">Type a number to set an exact count, or use − and +.</span>
      </div>
      <p role="alert" className="mt-3 min-h-5 text-sm text-[#E39A9D]">{problem}</p>

      {products.length === 0 ? (
        <p className="py-16 font-display text-3xl">Nothing matches.</p>
      ) : (
        <ul className="space-y-12">
          {products.map((p) => {
            const units = p.colorways.reduce((n, c) => n + p.sizes.reduce((m, s) => m + level(skuOf(p.slug, c.id, s)), 0), 0);
            const sizeHead = p.sizeLabel === "EU" ? "EU " : "";
            return (
              <li key={p.slug} className="border-t border-line pt-8">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                  <ProductImage src={p.colorways[0].images.front} alt="" sizes="64px" className="relative h-16 w-14 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-2xl leading-tight">
                      <Link href={`/products/${p.slug}`} className="link-draw">
                        {p.title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-mist">
                      {CATEGORIES.find((c) => c.slug === p.category)?.title} · {formatMoney(p.price)}
                    </p>
                  </div>
                  <p className="text-right">
                    <span key={units} className="anim-fade-quick block font-display text-2xl tabular-nums">{units}</span>
                    <span className="label text-smoke">units</span>
                  </p>
                </div>
                {/* Focusable so keyboard users can scroll wide size runs sideways. */}
                <div className="mt-5 overflow-x-auto pb-2 focus-visible:outline focus-visible:outline-1 focus-visible:outline-ivory" tabIndex={0} role="region" aria-label={`${p.title} stock by colour and size`}>
                  <table className="w-full border-separate border-spacing-1 text-left">
                    <caption className="sr-only">{p.title}: units in stock by colour and size</caption>
                    <thead>
                      <tr>
                        <th scope="col" className="label sticky left-0 z-10 bg-ink pb-1 pr-3 font-normal text-smoke">Colour</th>
                        {p.sizes.map((s) => (
                          <th key={s} scope="col" className="label pb-1 text-center font-normal text-smoke">
                            {s === "One size" ? s : `${sizeHead}${s}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {p.colorways.map((c) => (
                        <tr key={c.id}>
                          <th scope="row" className="sticky left-0 z-10 bg-ink pr-3 font-normal">
                            <span className="flex items-center gap-2.5 whitespace-nowrap text-[15px]">
                              <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/15" style={{ backgroundColor: c.swatch }} />
                              {c.name}
                            </span>
                          </th>
                          {p.sizes.map((s) => {
                            const sku = skuOf(p.slug, c.id, s);
                            return (
                              <td key={s} className={clsx("transition-opacity duration-quick", !matches(sku) && "opacity-30")}>
                                <StockCell
                                  value={level(sku)}
                                  status={stockStatus(level(sku), t)}
                                  flash={flashes[sku] ?? 0}
                                  label={`${p.title}, ${c.name}${p.sizes.length > 1 ? `, ${sizeHead}${s}` : ""}`}
                                  onAdjust={(d) => run(() => repo.adjust(sku, d))}
                                  onSet={(n) => run(() => repo.setLevel(sku, n))}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function StockCell({
  value, status, flash, label, onAdjust, onSet,
}: { value: number; status: StockStatus; flash: number; label: string; onAdjust: (d: number) => void; onSet: (n: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const n = Number.parseInt(draft, 10);
    setDraft(null);
    if (Number.isFinite(n) && n >= 0 && n !== value) onSet(Math.min(n, 9999));
  };
  const btn = "grid h-10 w-6 shrink-0 place-items-center text-lg text-mist transition-colors duration-quick hover:text-ivory disabled:opacity-30";
  return (
    <div className={clsx("relative flex items-center justify-between border", CELL_TONE[status])}>
      {/* The glow is a separate layer, re-keyed per change, so typing in the field is never interrupted. */}
      {flash > 0 && <span key={flash} aria-hidden="true" className="anim-flash pointer-events-none absolute inset-0" />}
      <button type="button" aria-label={`Remove one: ${label}`} disabled={value <= 0} onClick={() => onAdjust(-1)} className={btn}>
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={9999}
        aria-label={`Units in stock: ${label}`}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(null);
            e.currentTarget.blur();
          }
        }}
        className={clsx(
          "h-10 w-9 min-w-0 bg-transparent text-center text-[15px] tabular-nums outline-none [appearance:textfield] focus:bg-ivory focus:text-ink [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          status === "out" ? "text-[#E39A9D]" : status === "low" ? "text-bronze" : "text-ivory",
        )}
      />
      <button type="button" aria-label={`Add one: ${label}`} onClick={() => onAdjust(1)} className={btn}>
        +
      </button>
    </div>
  );
}
