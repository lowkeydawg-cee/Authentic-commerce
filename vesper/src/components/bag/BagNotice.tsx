"use client";

import { bagNotices, useBagNotices } from "@/lib/cart/stock-guard";

/** Explains stock corrections made to the bag. */
export function BagNotice({ className }: { className?: string }) {
  const notices = useBagNotices();
  return (
    <div role="status" className={className}>
      {notices.length > 0 && (
        <div className="anim-fade-quick flex items-start justify-between gap-4 border border-bronze/60 bg-night p-4 text-sm leading-relaxed">
          <ul className="space-y-1">
            {notices.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
          <button type="button" onClick={() => bagNotices.clear()} className="label link-draw tap shrink-0 text-mist hover:text-ivory">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
