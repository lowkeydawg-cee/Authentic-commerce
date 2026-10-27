import { APPAREL_SIZES, FOOTWEAR_SIZES } from "@/lib/fit";

/** Size chart table, used in the product-page dialog and on /size-guide. */
export function SizeTable({ kind }: { kind: "footwear" | "apparel" }) {
  const table = kind === "footwear" ? FOOTWEAR_SIZES : APPAREL_SIZES;
  return (
    // Focusable so keyboard users can scroll the table sideways on small screens.
    <div className="overflow-x-auto focus-visible:outline focus-visible:outline-1 focus-visible:outline-ivory" tabIndex={0} role="region" aria-label={table.caption}>
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
                  <th key={i} scope="row" className="py-3 pr-4 font-normal text-ivory">
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
  );
}
