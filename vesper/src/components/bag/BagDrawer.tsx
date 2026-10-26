"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { BAG_OPEN_EVENT } from "@/lib/cart/events";
import { resolveLines, subtotal } from "@/lib/cart/resolve";
import { useBag } from "@/lib/cart/store";
import { formatMoney } from "@/lib/format";
import { fadeStyle } from "@/motion/fade";
import { BagLines } from "./BagLines";

/**
 * Mini-bag (Step 7 · add-to-bag confirmation): slides in from the right,
 * closes itself 4 s after an add unless the shopper hovers or focuses it.
 */
export function BagDrawer() {
  const lines = resolveLines(useBag());
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [autoClose, setAutoClose] = useState(false);
  const [hold, setHold] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      returnFocus.current = document.activeElement as HTMLElement | null;
      setAutoClose((e as CustomEvent<{ added: boolean }>).detail?.added ?? false);
      setOpen(true);
    };
    window.addEventListener(BAG_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(BAG_OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) setHold(false);
  }, [open]);

  const close = () => {
    setOpen(false);
    returnFocus.current?.focus();
  };

  useEffect(() => {
    if (!open || !autoClose || hold) return;
    const t = setTimeout(() => setOpen(false), 4000);
    return () => clearTimeout(t);
  }, [open, autoClose, hold]);

  useEffect(() => {
    if (!open) return;
    // An add confirmation shouldn't steal focus from the buy button; a manual open should.
    if (!autoClose) requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("button, a")?.focus());
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, autoClose]);

  const total = subtotal(lines);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={close}
        style={fadeStyle(open)}
        className={clsx("fixed inset-0 z-[55] bg-ink/60", open ? "visible opacity-100" : "invisible opacity-0")}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-label="Your bag"
        inert={!open}
        // Only real pointer movement or focus pauses the auto-close: the drawer
        // opens under the cursor that just clicked "Add to bag".
        onPointerMove={(e) => (e.movementX !== 0 || e.movementY !== 0) && setHold(true)}
        onPointerLeave={() => setHold(false)}
        onFocus={() => setHold(true)}
        className={clsx(
          "fixed bottom-0 right-0 top-0 z-[56] flex w-full max-w-md flex-col border-l border-line bg-ink transition-[transform,visibility] duration-standard ease-glide",
          open ? "visible translate-x-0" : "invisible translate-x-full",
        )}
      >
        <div className="page-x flex h-[var(--header-h)] shrink-0 items-center justify-between border-b border-line sm:px-8">
          <p className="label">
            Your bag <span className="tabular-nums text-smoke">({lines.reduce((n, l) => n + l.line.quantity, 0)})</span>
          </p>
          <button type="button" onClick={close} className="label min-h-11 px-2 text-mist hover:text-ivory">
            Close
          </button>
        </div>
        {lines.length === 0 ? (
          <div className="page-x flex flex-1 flex-col items-start justify-center gap-5 sm:px-8">
            <p className="font-display text-3xl">Your bag is empty.</p>
            <Link href="/collections" className="label link-draw">
              Discover the collection
            </Link>
          </div>
        ) : (
          <>
            <div className="page-x flex-1 overflow-y-auto py-2 sm:px-8">
              <BagLines lines={lines} compact onNavigate={() => setOpen(false)} />
            </div>
            <div className="page-x space-y-4 border-t border-line py-6 sm:px-8">
              <div className="flex justify-between text-[15px]">
                <span className="text-mist">Subtotal</span>
                <span className="tabular-nums">{formatMoney(total)}</span>
              </div>
              <p className="text-sm text-smoke">Complimentary delivery. Taxes included.</p>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/bag" className="label flex min-h-12 items-center justify-center border border-line hover:border-ivory">
                  View bag
                </Link>
                <Link href="/checkout" className="label flex min-h-12 items-center justify-center bg-ivory font-semibold text-ink hover:bg-white">
                  Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
