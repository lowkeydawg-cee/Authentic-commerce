import clsx from "clsx";
import { Gem, Headphones, Lamp, Shirt, Watch, type LucideIcon } from "lucide-react";
import { ACCENTS } from "@/lib/accents";
import type { Product } from "@/lib/types";

const ICON_BY_SLUG: Record<string, LucideIcon> = {
  accessories: Watch,
  audio: Headphones,
  apparel: Shirt,
  home: Lamp,
};

/**
 * Product visual: the admin-supplied image when present, otherwise an
 * on-brand gradient composition so new products never look broken.
 */
export function ProductArt({
  product,
  categorySlug,
  className,
  iconClassName = "h-16 w-16",
}: {
  product: Pick<Product, "title" | "imageUrl" | "accent">;
  categorySlug?: string;
  className?: string;
  iconClassName?: string;
}) {
  const accent = ACCENTS[product.accent] ?? ACCENTS.amber;
  const Icon = (categorySlug && ICON_BY_SLUG[categorySlug]) || Gem;

  return (
    <div className={clsx("relative overflow-hidden bg-ink-800", className)}>
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-supplied hosts
        <img
          src={product.imageUrl}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <>
          <div className={clsx("absolute inset-0 bg-gradient-to-br", accent.gradient)} />
          <div className={clsx("absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl", accent.glow)} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_120%,rgba(255,255,255,0.12),transparent_60%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon
              strokeWidth={1}
              className={clsx(
                "text-white/80 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-transform duration-700 group-hover:-rotate-6 group-hover:scale-110",
                iconClassName,
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}
