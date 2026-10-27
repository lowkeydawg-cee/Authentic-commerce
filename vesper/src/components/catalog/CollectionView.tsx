import Link from "next/link";
import { PageHeader } from "@/components/editorial/PageHeader";
import { Reveal } from "@/components/home/Reveal";
import { commerce, type ColorFamily, type ProductQuery, type SortKey } from "@/lib/commerce";
import { FilterBar } from "./FilterBar";
import { ProductCard } from "./ProductCard";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

interface Props {
  eyebrow: string;
  title: string;
  intro: string;
  base: Omit<ProductQuery, "colors" | "sizes" | "sort">;
  searchParams: Awaited<SearchParams>;
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const list = (v: string | string[] | undefined) => first(v)?.split(",").filter(Boolean) ?? [];

/** One editorial interlude after this many products (Step 3 · collection page). */
const INTERLUDE_AFTER = 6;

export async function CollectionView({ eyebrow, title, intro, base, searchParams }: Props) {
  const colors = list(searchParams.colour) as ColorFamily[];
  const sizes = list(searchParams.size);
  const sort = (first(searchParams.sort) as SortKey) ?? "featured";

  const [products, all] = await Promise.all([
    commerce.listProducts({ ...base, colors, sizes, sort }),
    commerce.listProducts(base),
  ]);
  const availableColors = [...new Set(all.flatMap((p) => p.colorways.map((c) => c.family)))];
  const availableSizes = [...new Set(all.flatMap((p) => p.sizes))];

  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} intro={intro} />

      <FilterBar
        current={{ colour: colors, size: sizes, sort }}
        count={products.length}
        availableColors={availableColors}
        availableSizes={availableSizes}
      />

      <section
        id="product-grid"
        aria-label={`${title}: ${products.length} products`}
        className="page-x mx-auto max-w-page py-14 transition-opacity duration-quick data-[pending]:opacity-50 lg:py-20"
      >
        <h2 className="sr-only">Products</h2>
        {products.length === 0 ? (
          <div className="flex flex-col items-start gap-5 py-24">
            <p className="font-display text-4xl">Nothing in that combination.</p>
            <p className="text-mist">Try another colour or size, or clear the filters.</p>
            <Link href="?" scroll={false} className="label link-draw tap">
              Clear filters
            </Link>
          </div>
        ) : (
          <ul className="grid gap-x-6 gap-y-16 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((p, i) => (
              <WithInterlude key={p.slug} index={i} total={products.length}>
                <Reveal as="li" delay={(i % 3) * 80} eager={i < 3}>
                  <ProductCard product={p} preferFamilies={colors} priority={i < 3} />
                </Reveal>
              </WithInterlude>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

/** Inserts the editorial interlude into the grid flow after N products. */
function WithInterlude({ index, total, children }: { index: number; total: number; children: React.ReactNode }) {
  return (
    <>
      {children}
      {index === INTERLUDE_AFTER - 1 && total > INTERLUDE_AFTER && (
        <li className="sm:col-span-2 xl:col-span-3">
          <Reveal className="grid gap-8 border-y border-line py-14 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <blockquote className="font-display text-[clamp(30px,3.4vw,52px)] italic leading-[1.15]">
              “Every piece is built to be repaired, not replaced.”
            </blockquote>
            <div className="space-y-5">
              <p className="font-light leading-relaxed text-mist">
                Stitched soles can be resoled, waxed cotton re‑proofed and calf re‑conditioned. Turn any piece in 3D to see how
                it is made.
              </p>
              <Link href="/journal" className="label link-draw tap">
                Inside the atelier
              </Link>
            </div>
          </Reveal>
        </li>
      )}
    </>
  );
}
