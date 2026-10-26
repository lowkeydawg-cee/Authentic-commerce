"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import type { StoreSettings } from "@/lib/types";
import { useInventory } from "@/store/inventory";
import { toast } from "@/store/toast";

export function SettingsPanel() {
  const { settings, repo } = useInventory();
  const [form, setForm] = useState<StoreSettings>(settings);
  const [saving, setSaving] = useState(false);

  // Re-sync only when the stored values change, not on every live reload.
  const storedKey = JSON.stringify(settings);
  useEffect(() => setForm(JSON.parse(storedKey) as StoreSettings), [storedKey]);

  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => setForm((f) => ({ ...f, [key]: value }));
  const dirty = JSON.stringify(form) !== storedKey;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await repo.updateSettings({
        ...form,
        currency: form.currency.trim().toUpperCase() || "RWF",
        lowStockThreshold: Math.max(0, Math.floor(form.lowStockThreshold)),
      });
      toast({ tone: "success", title: "Storefront updated", description: "Changes are live for every shopper." });
    } catch (err) {
      toast({ tone: "error", title: "Couldn't save settings", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="glass rounded-3xl p-5">
      <h3 className="font-display text-xl">Storefront content</h3>
      <p className="mt-1 text-sm text-white/45">Edit the hero copy, branding and stock alert rules. Featured hero products are picked with the ★ toggle in the inventory table.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Store name" name="storeName" value={form.storeName} onChange={(e) => set("storeName", e.target.value)} />
        <Field label="Hero eyebrow" name="heroEyebrow" value={form.heroEyebrow} onChange={(e) => set("heroEyebrow", e.target.value)} />
        <Field label="Hero headline" name="heroTitle" value={form.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} className="sm:col-span-2" />
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">Hero subtitle</span>
          <textarea className={`${inputClass} min-h-20`} value={form.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} />
        </label>
        <Field label="Currency (ISO code)" name="currency" maxLength={3} value={form.currency} onChange={(e) => set("currency", e.target.value)} />
        <Field label="Low stock threshold" name="lowStockThreshold" type="number" min={0} value={form.lowStockThreshold} onChange={(e) => set("lowStockThreshold", Number(e.target.value))} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {repo.resetDemo ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (!window.confirm("Reset all products, categories, settings and orders to the demo data?")) return;
              await repo.resetDemo?.();
              toast({ tone: "info", title: "Demo data restored" });
            }}
          >
            <RotateCcw className="h-4 w-4" /> Reset demo data
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" loading={saving} disabled={!dirty}>Publish changes</Button>
      </div>
    </form>
  );
}
