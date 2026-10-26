"use client";

import Link from "next/link";
import clsx from "clsx";
import { fadeStyle } from "@/motion/fade";
import { CATEGORIES } from "@/lib/navigation";

interface Props {
  open: boolean;
  onNavigate: () => void;
  onMouseEnter: () => void;
}

/** Editorial mega-panel under the header: categories set large, plus the current campaign. */
export function CollectionMenu({ open, onNavigate, onMouseEnter }: Props) {
  return (
    <div
      id="collection-menu"
      onMouseEnter={onMouseEnter}
      inert={!open}
      aria-hidden={!open}
      style={fadeStyle(open)}
      className={clsx(
        "absolute inset-x-0 top-full hidden border-b border-line bg-ink/[0.98] backdrop-blur-md lg:block",
        open ? "visible opacity-100" : "invisible opacity-0",
      )}
    >
      <div className="page-x mx-auto grid max-w-page grid-cols-[1fr_1fr_minmax(0,1.2fr)] gap-12 py-14">
        <div>
          <p className="label mb-6 text-smoke">Shop by category</p>
          <ul className="space-y-2">
            {CATEGORIES.map((c, i) => (
              <li
                key={c.href}
                style={{ transitionDelay: open ? `${i * 60}ms` : "0ms" }}
                className={clsx(
                  "transition-[opacity,transform] duration-standard ease-glide",
                  open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                )}
              >
                <Link
                  href={c.href}
                  onClick={onNavigate}
                  className="font-display text-4xl leading-tight text-ivory transition-colors duration-quick hover:text-bronze focus-visible:text-bronze"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label mb-6 text-smoke">Edits</p>
          <ul className="space-y-4 text-[15px] text-mist">
            <li><Link href="/collections" onClick={onNavigate} className="link-draw hover:text-ivory">View everything</Link></li>
            <li><Link href="/collections/the-nocturne" onClick={onNavigate} className="link-draw hover:text-ivory">The Nocturne</Link></li>
            <li><Link href="/collections/new" onClick={onNavigate} className="link-draw hover:text-ivory">New arrivals</Link></li>
          </ul>
        </div>
        <Link
          href="/collections/the-nocturne"
          onClick={onNavigate}
          className="group relative flex min-h-[260px] flex-col justify-end overflow-hidden bg-[radial-gradient(ellipse_60%_55%_at_55%_40%,#4A423C_0%,#1D1A18_55%,#0B0B0C_100%)] p-7"
        >
          <span className="label text-bronze">The campaign</span>
          <span className="mt-2 font-display text-3xl italic">The Nocturne</span>
          <span className="label link-draw mt-4 self-start text-mist group-hover:bg-[length:100%_1px]">Discover</span>
        </Link>
      </div>
    </div>
  );
}
