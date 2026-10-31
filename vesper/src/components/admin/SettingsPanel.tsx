"use client";

import { useEffect, useId, useState } from "react";
import type { InventoryRepository } from "@/lib/inventory";
import { refreshInventory } from "@/lib/inventory/live";
import type { InventorySnapshot } from "@/lib/inventory/types";

export function SettingsPanel({ repo, snapshot }: { repo: InventoryRepository; snapshot: InventorySnapshot }) {
  const id = useId();
  const current = snapshot.settings.lowStockThreshold;
  const [threshold, setThreshold] = useState(String(current));
  const [status, setStatus] = useState<string | null>(null);
  useEffect(() => setThreshold(String(current)), [current]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number.parseInt(threshold, 10);
    if (!Number.isFinite(n) || n < 0 || n > 99) {
      setStatus("Enter a number from 0 to 99.");
      return;
    }
    try {
      await repo.updateSettings({ lowStockThreshold: n });
      await refreshInventory();
      setStatus(`Saved. Sizes with ${n} or fewer left now show “Only N left”.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Couldn't save.");
    }
  };

  const reset = async () => {
    if (!repo.resetDemo || !window.confirm("Restore the opening demo stock and clear all orders in this browser?")) return;
    await repo.resetDemo();
    await refreshInventory();
    setStatus("Demo stock restored.");
  };

  return (
    <section aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="border-b border-line pb-4 font-display text-3xl">
        Settings
      </h2>
      <form onSubmit={save} className="mt-6 flex items-end gap-4">
        <div className="flex-1">
          <label htmlFor={`${id}-t`} className="label text-mist">
            Low-stock alert at
          </label>
          <input
            id={`${id}-t`}
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            aria-describedby={`${id}-help`}
            className="mt-2 block min-h-12 w-full border border-line bg-transparent px-4 text-[15px] tabular-nums text-ivory outline-none focus:border-ivory"
          />
        </div>
        <button type="submit" className="label min-h-12 border border-ivory px-6 transition-colors duration-quick hover:bg-ivory hover:text-ink">
          Save
        </button>
      </form>
      <p id={`${id}-help`} className="mt-2 text-sm text-smoke">Units left at or below this count as low stock, and shoppers see “Only N left”.</p>
      <p role="status" className="mt-3 min-h-5 text-sm text-mist">{status}</p>
      {repo.resetDemo && (
        <div className="mt-6 border-t border-line pt-6">
          <p className="text-sm leading-relaxed text-mist">This demo keeps stock in this browser. Open the store in another tab and place an order to watch the numbers change here.</p>
          <button type="button" onClick={reset} className="label link-draw tap mt-3 text-mist hover:text-ivory">
            Restore demo stock
          </button>
        </div>
      )}
    </section>
  );
}
