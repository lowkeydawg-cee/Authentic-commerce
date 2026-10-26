"use client";

import Link from "next/link";
import clsx from "clsx";
import { fadeStyle } from "@/motion/fade";
import { useEffect, useRef } from "react";
import { CATEGORIES, HOUSE_LINKS, SUPPORT_LINKS } from "@/lib/navigation";
import { CloseIcon } from "./icons";
import { Wordmark } from "./Wordmark";

interface Props {
  open: boolean;
  onClose: () => void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Full-screen menu for small screens: focus-trapped dialog, Escape to close. */
export function MobileMenu({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Keep the latest callback without re-running the open/close effect.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Wait a frame so the panel is no longer inert/hidden before focusing.
    const frame = requestAnimationFrame(() => closeRef.current?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      inert={!open}
      aria-hidden={!open}
      style={fadeStyle(open)}
      className={clsx(
        "fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-ink lg:hidden",
        open ? "visible opacity-100" : "invisible opacity-0",
      )}
    >
      <div className="page-x flex h-[var(--header-h)] shrink-0 items-center justify-between border-b border-line">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="-ml-3 grid h-11 w-11 place-items-center"
        >
          <CloseIcon />
        </button>
        <Wordmark className="text-xl" />
        <span className="w-11" aria-hidden="true" />
      </div>

      <nav aria-label="Mobile" className="page-x flex flex-1 flex-col gap-12 py-10">
        <ul className="space-y-1">
          {[{ label: "View everything", href: "/collections" }, ...CATEGORIES].map((c, i) => (
            <li
              key={c.href}
              style={{ transitionDelay: open ? `${120 + i * 70}ms` : "0ms" }}
              className={clsx(
                "transition-[opacity,transform] duration-standard ease-glide",
                open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
              )}
            >
              <Link href={c.href} onClick={onClose} className="block py-1.5 font-display text-[40px] leading-tight">
                {c.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 gap-8">
          <ul className="space-y-3">
            {HOUSE_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={onClose} className="label inline-flex min-h-11 items-center text-mist">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="space-y-3">
            {SUPPORT_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={onClose} className="label inline-flex min-h-11 items-center text-mist">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-auto font-display text-lg italic text-smoke">Dressed for the after‑hours.</p>
      </nav>
    </div>
  );
}
