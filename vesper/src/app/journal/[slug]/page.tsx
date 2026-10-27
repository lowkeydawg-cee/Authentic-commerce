import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Reveal } from "@/components/home/Reveal";
import { ProductImage } from "@/components/media/ProductImage";
import { ARTICLES, getArticle, listArticles, readingMinutes, type JournalBlock } from "@/content/journal";
import { commerce, type Product } from "@/lib/commerce";
import { formatDate } from "@/lib/format";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const a = getArticle((await params).slug);
  return a ? { title: a.title, description: a.excerpt, openGraph: { type: "article", images: [a.cover.src] } } : {};
}

export default async function ArticlePage({ params }: { params: Params }) {
  const article = getArticle((await params).slug);
  if (!article) notFound();

  const slugs = article.body.flatMap((b) => (b.type === "products" ? b.slugs : []));
  const products = new Map((await Promise.all(slugs.map((s) => commerce.getProduct(s)))).filter((p): p is Product => !!p).map((p) => [p.slug, p]));
  const all = listArticles();
  const next = all[(all.findIndex((a) => a.slug === article.slug) + 1) % all.length];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    image: article.cover.src,
    publisher: { "@type": "Organization", name: "VESPER" },
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="page-x mx-auto max-w-page pt-[calc(var(--header-h)+56px)]">
        <Reveal eager className="mx-auto max-w-3xl text-center">
          <nav aria-label="Breadcrumb">
            <Link href="/journal" className="label link-draw tap text-smoke hover:text-ivory">
              Journal
            </Link>
          </nav>
          <h1 className="mt-4 font-display text-[clamp(44px,6vw,96px)] leading-[0.98]">{article.title}</h1>
          <p className="mx-auto mt-6 max-w-xl text-[18px] font-light leading-relaxed text-mist">{article.excerpt}</p>
          <p className="label mt-8 text-smoke">
            {article.kicker} · <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time> · {readingMinutes(article)} min read
          </p>
        </Reveal>
        <ProductImage src={article.cover.src} alt={article.cover.alt} sizes="(min-width: 1440px) 1360px, 100vw" priority className="relative mt-14 aspect-[16/10] lg:mt-20" />
      </header>

      <div className="page-x mx-auto max-w-page py-16 lg:py-24">
        {article.body.map((block, i) => (
          <Block key={i} block={block} products={products} />
        ))}
      </div>

      <aside aria-labelledby="next-title" className="border-t border-line">
        <div className="page-x mx-auto flex max-w-page flex-col gap-4 py-16 lg:flex-row lg:items-end lg:justify-between lg:py-24">
          <div>
            <p id="next-title" className="label text-smoke">
              Next in the journal
            </p>
            <p className="mt-3 font-display text-[clamp(32px,4vw,56px)] leading-tight">
              <Link href={`/journal/${next.slug}`} className="hover:text-bronze">
                {next.title}
              </Link>
            </p>
          </div>
          <Link href="/journal" className="label link-draw tap self-start lg:self-auto">
            All stories
          </Link>
        </div>
      </aside>
    </article>
  );
}

function Block({ block, products }: { block: JournalBlock; products: Map<string, Product> }) {
  const prose = "mx-auto max-w-[680px]";
  switch (block.type) {
    case "p":
      return <p className={`${prose} mb-7 text-[18px] font-light leading-[1.75] text-mist first-of-type:text-ivory`}>{block.text}</p>;
    case "h2":
      return (
        <Reveal className={`${prose} mb-6 mt-16`}>
          <h2 className="font-display text-[clamp(28px,3vw,40px)] leading-tight">{block.text}</h2>
        </Reveal>
      );
    case "quote":
      return (
        <Reveal className="mx-auto my-16 max-w-4xl border-y border-line py-12 text-center lg:my-24">
          <blockquote className="font-display text-[clamp(30px,3.6vw,52px)] italic leading-[1.2]">“{block.text}”</blockquote>
        </Reveal>
      );
    case "figure":
      return (
        <Reveal as="div" variant="wipe" className="mx-auto my-14 max-w-4xl lg:my-20">
          <figure>
            <ProductImage src={block.src} alt={block.alt} sizes="(min-width: 1024px) 896px, 100vw" className="relative aspect-[4/5] sm:aspect-[5/4]" />
            <figcaption className="mt-4 text-sm leading-relaxed text-smoke">{block.caption}</figcaption>
          </figure>
        </Reveal>
      );
    case "products": {
      const list = block.slugs.map((s) => products.get(s)).filter((p): p is Product => !!p);
      return (
        <section aria-labelledby="shop-the-story" className="mt-20 border-t border-line pt-14 lg:mt-28">
          <h2 id="shop-the-story" className="label mb-10 text-smoke">
            {block.title}
          </h2>
          <ul className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={(i % 4) * 80}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </ul>
        </section>
      );
    }
  }
}
