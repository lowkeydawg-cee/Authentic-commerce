import Link from "next/link";
import clsx from "clsx";
import { ProductImage } from "@/components/media/ProductImage";
import { formatMoney } from "@/lib/format";
import type { ColorFamily, Product } from "@/lib/commerce";

interface Props {
  product: Product;
  /** When a colour filter is active, lead with the matching colourway. */
  preferFamilies?: ColorFamily[];
  priority?: boolean;
}

export function ProductCard({ product, preferFamilies, priority }: Props) {
  const lead = product.colorways.find((c) => preferFamilies?.includes(c.family)) ?? product.colorways[0];
  const soldOut = product.colorways.every((c) => product.sizes.every((s) => c.soldOutSizes.includes(s)));
  const href = `/products/${product.slug}?colour=${lead.id}`;

  return (
    <article className="group relative">
      <Link href={href} className="block" aria-label={`${product.title}, ${lead.name}, ${formatMoney(product.price)}`}>
        <div className="relative aspect-[4/5] overflow-hidden">
          <ProductImage
            src={lead.images.front}
            alt={`${product.title} in ${lead.name}`}
            sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 90vw"
            priority={priority}
            className="absolute inset-0 transition-transform duration-standard ease-glide group-hover:scale-[1.03]"
          />
          {/* Second angle crossfades in on hover (Step 7 · hover states). display:none on
              touch screens, so the lazy image is never downloaded there. */}
          <ProductImage
            src={lead.images.alt}
            alt=""
            sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 90vw"
            className="absolute inset-0 hidden opacity-0 transition-opacity duration-standard ease-glide group-hover:opacity-100 motion-reduce:!hidden [@media(hover:hover)]:block"
          />
          <div className="absolute left-4 top-4 flex gap-2">
            {product.tags.includes("new") && <span className="label bg-ink/70 px-2.5 py-1 text-ivory backdrop-blur-sm">New</span>}
            {soldOut && <span className="label bg-ink/70 px-2.5 py-1 text-mist backdrop-blur-sm">Sold out</span>}
          </div>
        </div>
      </Link>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-xl leading-snug sm:text-2xl">
            <Link href={href} className="link-draw group-hover:bg-[length:100%_1px]" tabIndex={-1}>
              {product.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm font-light text-mist">{product.material}</p>
        </div>
        <p className="shrink-0 pt-1 text-[15px] tabular-nums">{formatMoney(product.price)}</p>
      </div>

      <ul className="mt-3 flex items-center gap-2" aria-label={`${product.colorways.length} colours`}>
        {product.colorways.map((c) => (
          <li key={c.id}>
            <span
              title={c.name}
              className={clsx(
                "block h-3.5 w-3.5 rounded-full border",
                c.id === lead.id ? "border-ivory" : "border-line",
              )}
              style={{ backgroundColor: c.swatch }}
            />
            <span className="sr-only">{c.name}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
