"use client";

import { allVariants } from "@/lib/inventory/seed";
import { stockStatus, type InventorySnapshot } from "@/lib/inventory/types";
import { formatMoney } from "@/lib/format";

const VARIANTS = allVariants();

export function Kpis({ snapshot }: { snapshot: InventorySnapshot }) {
  const t = snapshot.settings.lowStockThreshold;
  let units = 0, value = 0, low = 0, out = 0;
  for (const v of VARIANTS) {
    const n = snapshot.levels[v.sku] ?? 0;
    units += n;
    value += n * v.product.price.amount;
    const s = stockStatus(n, t);
    if (s === "low") low++;
    if (s === "out") out++;
  }
  const revenue = snapshot.orders.reduce((sum, o) => sum + o.total, 0);
  const rwf = (amount: number) => formatMoney({ amount, currencyCode: "RWF" });

  const cards = [
    { label: "Units in stock", value: units.toLocaleString("en-GB"), note: `${VARIANTS.length} sizes and colours` },
    { label: "Stock value", value: rwf(value), note: "At retail price" },
    { label: "Low stock", value: String(low), note: `${t} or fewer left`, tone: low > 0 ? "text-bronze" : "" },
    { label: "Sold out", value: String(out), note: "Sizes at zero", tone: out > 0 ? "text-[#E39A9D]" : "" },
    { label: "Orders", value: String(snapshot.orders.length), note: `${rwf(revenue)} total` },
  ];

  return (
    <dl className="mt-10 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="bg-ink p-5 last:col-span-2 sm:last:col-span-1">
          <dt className="label text-smoke">{c.label}</dt>
          {/* Re-keyed on change so the new figure fades in. */}
          <dd key={c.value} className={`anim-fade-quick mt-3 font-display sm:whitespace-nowrap text-[clamp(22px,2vw,30px)] tabular-nums ${c.tone ?? ""}`}>
            {c.value}
          </dd>
          <dd className="mt-1 text-sm text-mist">{c.note}</dd>
        </div>
      ))}
    </dl>
  );
}
