"use client";

import { useRef } from "react";
import { APPAREL_SIZES, FOOTWEAR_SIZES } from "@/lib/fit";

export function SizeGuide({ kind }: { kind: "footwear" | "apparel" }) {
  const ref = useRef<HTMLDialogElement>(null);
  const table = kind === "footwear" ? FOOTWEAR_SIZES : APPAREL_SIZES;
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="label link-draw text-mist hover:text-ivory">
        Size guide
      </button>
      <dialog
        ref={ref}
        aria-labelledby="size-guide-title"
        onClick={(e) => e.target === ref.current && ref.current?.close()}
        className="w-[min(92vw,640px)] border border-line bg-ink p-0 text-ivory backdrop:bg-ink/80"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 id="size-guide-title" className="font-display text-2xl">
            Size guide
          </h2>
          <form method="dialog">
            <button className="label min-h-11 px-2">Close</button>
          </form>
        </div>
        <div className="space-y-6 p-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm tabular-nums">
              <caption className="mb-4 text-left text-sm text-mist">{table.caption}</caption>
              <thead>
                <tr className="border-b border-line">
                  {table.columns.map((c) => (
                    <th key={c} scope="col" className="label py-3 pr-4 font-normal text-smoke">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row[0]} className="border-b border-line/60">
                    {row.map((cell, i) =>
                      i === 0 ? (
                        <th key={i} scope="row" className="py-3 pr-4 font-normal">
                          {cell}
                        </th>
                      ) : (
                        <td key={i} className="py-3 pr-4 text-mist">
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm leading-relaxed text-mist">
            <span className="text-ivory">How to measure: </span>
            {table.howTo}
          </p>
        </div>
      </dialog>
    </>
  );
}
