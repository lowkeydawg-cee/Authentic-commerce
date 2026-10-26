"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ProductArt } from "@/components/ui/ProductArt";
import { ACCENTS, ACCENT_OPTIONS } from "@/lib/accents";
import type { Product, ProductInput } from "@/lib/types";
import { useInventory } from "@/store/inventory";
import { toast } from "@/store/toast";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Product to edit; omit to create a new one. */
  product?: Product | null;
}

function blank(categoryId: string): ProductInput {
  return {
    sku: "",
    title: "",
    description: "",
    categoryId,
    price: 0,
    stock: 0,
    visible: true,
    featured: false,
    imageUrl: null,
    accent: "amber",
  };
}

export function ProductFormModal({ open, onClose, product }: Props) {
  const { repo, categories, products, settings } = useInventory();
  const [form, setForm] = useState<ProductInput>(() => blank(categories[0]?.id ?? ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialise only when the modal opens (live reloads must not wipe edits).
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (product) {
      setForm({
        sku: product.sku,
        title: product.title,
        description: product.description,
        categoryId: product.categoryId,
        price: product.price,
        stock: product.stock,
        visible: product.visible,
        featured: product.featured,
        imageUrl: product.imageUrl,
        accent: product.accent,
      });
    } else {
      setForm(blank(categories[0]?.id ?? ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?.id]);

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const sku = form.sku.trim().toUpperCase();
    if (!form.title.trim() || !sku) return setError("Title and SKU are required.");
    if (!form.categoryId) return setError("Create a category first.");
    if (form.price < 0 || form.stock < 0) return setError("Price and stock cannot be negative.");
    if (products.some((p) => p.sku.toUpperCase() === sku && p.id !== product?.id)) {
      return setError(`SKU ${sku} is already in use.`);
    }

    setSaving(true);
    setError(null);
    const payload: ProductInput = {
      ...form,
      sku,
      title: form.title.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl?.trim() || null,
      stock: Math.floor(form.stock),
    };
    try {
      if (product) {
        await repo.updateProduct(product.id, payload);
        toast({ tone: "success", title: "Product updated", description: payload.title });
      } else {
        await repo.createProduct(payload);
        toast({ tone: "success", title: "Product created", description: payload.title });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
  };

  const slug = categories.find((c) => c.id === form.categoryId)?.slug;

  return (
    <Modal open={open} onClose={onClose} title={product ? "Edit product" : "New product"} className="sm:max-w-2xl">
      <form onSubmit={save} className="space-y-5">
        <div className="flex gap-5">
          <ProductArt product={form} categorySlug={slug} className="hidden h-36 w-36 shrink-0 rounded-2xl sm:block" iconClassName="h-12 w-12" />
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <Field label="Title" name="title" value={form.title} onChange={(e) => set("title", e.target.value)} className="sm:col-span-2" required />
            <Field label="SKU" name="sku" value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="ACC-WCH-010" required />
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">Category</span>
              <select className={inputClass} value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-ink-900">
                    {c.name}{c.visible ? "" : " (hidden)"}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">Description</span>
          <textarea className={clsx(inputClass, "min-h-20 resize-y")} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={`Unit price (${settings.currency})`} name="price" type="number" min={0} step="any" value={form.price} onChange={(e) => set("price", Number(e.target.value))} />
          <Field label="Stock quantity" name="stock" type="number" min={0} step={1} value={form.stock} onChange={(e) => set("stock", Number(e.target.value))} />
          <Field label="Image URL (optional)" name="imageUrl" type="url" placeholder="https://…" value={form.imageUrl ?? ""} onChange={(e) => set("imageUrl", e.target.value)} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">Accent</span>
            <div className="flex gap-2">
              {ACCENT_OPTIONS.map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => set("accent", a)}
                  aria-label={`Accent ${a}`}
                  className={clsx(
                    "h-7 w-7 rounded-full transition",
                    ACCENTS[a].swatch,
                    form.accent === a ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-ink-900" : "opacity-60 hover:opacity-100",
                  )}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-5 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={form.visible} onChange={(e) => set("visible", e.target.checked)} />
              Visible on storefront
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
              Featured in hero
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-rose-300">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{product ? "Save changes" : "Create product"}</Button>
        </div>
      </form>
    </Modal>
  );
}
