"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { COLOR_FAMILIES, type SortKey } from "@/lib/commerce/types";
import { fadeStyle } from "@/motion/fade";

const SORTS: { id: SortKey; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
];

interface Props {
  count: number;
  availableColors: string[];
  availableSizes: string[];
}

/**
 * Filters live in the URL (?colour=black,ivory&size=42&sort=newest) so views
 * are shareable, back-button friendly and rendered on the server.
 */
export function FilterBar({ count, availableColors, availableSizes }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);

  const colours = params.get("colour")?.split(",").filter(Boolean) ?? [];
  const sizes = params.get("size")?.split(",").filter(Boolean) ?? [];
  const sort = (params.get("sort") as SortKey) ?? "featured";
  const activeCount = colours.length + sizes.length;

  const update = (key: string, values: string[] | string | null) => {
    const next = new URLSearchParams(params.toString());
    const value = Array.isArray(values) ? values.join(",") : values;
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  const toggle = (key: "colour" | "size", list: string[], value: string) =>
    update(key, list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  const clear = () => startTransition(() => router.replace(sort !== "featured" ? `${pathname}?sort=${sort}` : pathname, { scroll: false }));

  // Dim the grid while the server renders the new result.
  useEffect(() => {
    document.getElementById("product-grid")?.toggleAttribute("data-pending", pending);
  }, [pending]);

  const colourOptions = COLOR_FAMILIES.filter((c) => availableColors.includes(c.id));

  const controls = (layout: "bar" | "sheet") => (
    <>
      <Group label="Colour" layout={layout} badge={colours.length}>
        <div className="flex flex-wrap gap-2">
          {colourOptions.map((c) => {
            const on = colours.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle("colour", colours, c.id)}
                className={clsx(
                  "flex min-h-11 items-center gap-2.5 border px-3.5 text-sm transition-colors duration-quick",
                  on ? "border-ivory text-ivory" : "border-line text-mist hover:border-mist hover:text-ivory",
                )}
              >
                <span className="h-3.5 w-3.5 rounded-full border border-line" style={{ backgroundColor: c.swatch }} aria-hidden="true" />
                {c.label}
              </button>
            );
          })}
        </div>
      </Group>
      <Group label="Size" layout={layout} badge={sizes.length}>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {availableSizes.map((s) => {
            const on = sizes.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => toggle("size", sizes, s)}
                className={clsx(
                  "min-h-11 min-w-14 border px-3 text-sm tabular-nums transition-colors duration-quick",
                  on ? "border-ivory bg-ivory text-ink" : "border-line text-mist hover:border-mist hover:text-ivory",
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </Group>
    </>
  );

  const sortSelect = (id: string) => (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="label text-smoke">
        Sort
      </label>
      <select
        id={id}
        value={sort}
        onChange={(e) => update("sort", e.target.value === "featured" ? null : e.target.value)}
        className="label min-h-11 cursor-pointer border-b border-line bg-transparent pr-2 text-ivory outline-none focus-visible:border-ivory"
      >
        {SORTS.map((s) => (
          <option key={s.id} value={s.id} className="bg-ink normal-case tracking-normal">
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="sticky top-0 z-30 border-y border-line bg-ink/95 backdrop-blur-md">
      <div className="page-x mx-auto flex min-h-16 max-w-page flex-wrap items-center justify-between gap-4">
        {/* Desktop */}
        <div className="hidden items-center gap-8 lg:flex">{controls("bar")}</div>
        {/* Mobile trigger */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          className="label flex min-h-11 items-center gap-2 lg:hidden"
        >
          Filter &amp; sort{activeCount > 0 && <span className="tabular-nums text-bronze">({activeCount})</span>}
        </button>

        <div className="flex items-center gap-6">
          <p className="label text-smoke" aria-live="polite">
            {pending ? "Updating…" : `${count} ${count === 1 ? "piece" : "pieces"}`}
          </p>
          {activeCount > 0 && (
            <button type="button" onClick={clear} className="label link-draw hidden text-mist hover:text-ivory lg:inline">
              Clear
            </button>
          )}
          <div className="hidden lg:block">{sortSelect("sort-desktop")}</div>
        </div>
      </div>

      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} count={count} pending={pending} onClear={clear} activeCount={activeCount}>
        {sortSelect("sort-mobile")}
        {controls("sheet")}
      </FilterSheet>
    </div>
  );
}

/** Desktop: a disclosure dropdown. Mobile sheet: an always-open section. */
function Group({ label, layout, badge, children }: { label: string; layout: "bar" | "sheet"; badge: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  if (layout === "sheet") {
    return (
      <fieldset className="border-t border-line pt-6">
        <legend className="label mb-4 text-smoke">{label}</legend>
        {children}
      </fieldset>
    );
  }
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="label flex min-h-11 items-center gap-2"
      >
        {label}
        {badge > 0 && <span className="tabular-nums text-bronze">({badge})</span>}
        <span aria-hidden="true" className={clsx("transition-transform duration-quick", open && "rotate-180")}>
          ⌄
        </span>
      </button>
      <div
        id={id}
        role="group"
        aria-label={label}
        inert={!open}
        style={fadeStyle(open, 300)}
        className={clsx(
          "absolute left-0 top-full z-10 mt-2 w-[min(420px,80vw)] border border-line bg-night p-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)]",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function FilterSheet({
  open, onClose, count, pending, onClear, activeCount, children,
}: { open: boolean; onClose: () => void; count: number; pending: boolean; onClear: () => void; activeCount: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label="Filter and sort"
      className="m-0 mt-auto max-h-[88svh] w-full max-w-none overflow-y-auto bg-ink p-0 text-ivory backdrop:bg-ink/80 lg:hidden"
    >
      <div className="page-x flex items-center justify-between border-b border-line py-4">
        <p className="label">Filter &amp; sort</p>
        <button type="button" onClick={onClose} className="label min-h-11 px-2">
          Close
        </button>
      </div>
      <div className="page-x space-y-8 py-6">{children}</div>
      <div className="page-x sticky bottom-0 flex gap-3 border-t border-line bg-ink py-4">
        <button type="button" onClick={onClear} disabled={activeCount === 0} className="label min-h-12 flex-1 border border-line disabled:opacity-40">
          Clear
        </button>
        <button type="button" onClick={onClose} className="label min-h-12 flex-[2] bg-ivory font-semibold text-ink">
          {pending ? "Updating…" : `Show ${count} ${count === 1 ? "piece" : "pieces"}`}
        </button>
      </div>
    </dialog>
  );
}
