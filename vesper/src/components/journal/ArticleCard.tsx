import Link from "next/link";
import clsx from "clsx";
import { ProductImage } from "@/components/media/ProductImage";
import { readingMinutes, type Article } from "@/content/journal";
import { formatDate } from "@/lib/format";

export function ArticleCard({ article, featured = false, priority = false }: { article: Article; featured?: boolean; priority?: boolean }) {
  const Heading = featured ? "h2" : "h3";
  return (
    <article className={clsx("group relative", featured && "lg:grid lg:grid-cols-[3fr_2fr] lg:items-end lg:gap-12")}>
      <ProductImage
        src={article.cover.src}
        alt={article.cover.alt}
        sizes={featured ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 45vw, 100vw"}
        priority={priority}
        className="relative aspect-[16/10]"
        imgClassName="transition-transform duration-cinematic ease-glide group-hover:scale-[1.03]"
      />
      <div className={clsx("mt-6", featured && "lg:mt-0 lg:pb-2")}>
        <p className="label text-smoke">
          {article.kicker} · {formatDate(article.publishedAt)} · {readingMinutes(article)} min read
        </p>
        <Heading className={clsx("mt-3 font-display leading-[1.05]", featured ? "text-[clamp(36px,4.4vw,64px)]" : "text-3xl sm:text-4xl")}>
          {/* Whole card is the link target; the heading carries the accessible name. */}
          <Link href={`/journal/${article.slug}`} className="after:absolute after:inset-0">
            {article.title}
          </Link>
        </Heading>
        <p className="mt-4 max-w-lg text-[16px] font-light leading-relaxed text-mist">{article.excerpt}</p>
        <span aria-hidden="true" className="label link-draw mt-6 inline-block">
          Read
        </span>
      </div>
    </article>
  );
}
