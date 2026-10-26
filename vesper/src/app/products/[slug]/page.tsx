import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Reveal } from "@/components/home/Reveal";
import { ProductExperience, ProductExperienceWithUrl } from "@/components/product/ProductExperience";
import { commerce } from "@/lib/commerce";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return (await commerce.listProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await commerce.getProduct((await params).slug);
  if (!product) return {};
  return {
    title: product.title,
    description: product.description,
    openGraph: { title: `${product.title} · VESPER`, description: product.description, images: [product.colorways[0].images.front] },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await commerce.getProduct(slug);
  if (!product) notFound();

  const [categories, all] = await Promise.all([commerce.listCategories(), commerce.listProducts()]);
  const category = categories.find((c) => c.slug === product.category)!;
  // "Complete the look": other categories first, then the rest.
  const related = all
    .filter((p) => p.slug !== product.slug)
    .sort((a, b) => Number(a.category === product.category) - Number(b.category === product.category) || a.rank - b.rank)
    .slice(0, 4);

  const inStock = product.colorways.some((c) => product.sizes.some((s) => !c.soldOutSizes.includes(s)));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    brand: { "@type": "Brand", name: "VESPER" },
    category: category.title,
    image: product.colorways.map((c) => c.images.front),
    offers: {
      "@type": "Offer",
      price: product.price.amount,
      priceCurrency: product.price.currencyCode,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="page-x mx-auto max-w-page pb-6 pt-[calc(var(--header-h)+24px)]">
        <ol className="label flex flex-wrap gap-2 text-smoke">
          <li><Link href="/collections" className="hover:text-ivory">Collection</Link> /</li>
          <li><Link href={`/collections/${category.slug}`} className="hover:text-ivory">{category.title}</Link> /</li>
          <li aria-current="page" className="text-mist">{product.title}</li>
        </ol>
      </nav>

      <div className="page-x mx-auto max-w-page pb-24">
        <Suspense fallback={<ProductExperience product={product} />}>
          <ProductExperienceWithUrl product={product} />
        </Suspense>
      </div>

      <section aria-labelledby="made-title" className="border-t border-line">
        <div className="page-x mx-auto max-w-page py-24">
          <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <h2 id="made-title" className="font-display text-[clamp(36px,4vw,60px)] leading-none">
              How it&apos;s made
            </h2>
          </Reveal>
          <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-4">
            {product.highlights.map((h, i) => (
              <Reveal as="li" key={h.id} delay={i * 80} className="border-t border-line pt-6">
                <p className="label text-bronze">{h.kicker}</p>
                <h3 className="mt-3 font-display text-2xl">{h.title}</h3>
                <p className="mt-3 text-[15px] font-light leading-relaxed text-mist">{h.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="reviews-title" className="border-t border-line">
        <div className="page-x mx-auto grid max-w-page gap-10 py-24 lg:grid-cols-[1fr_2fr]">
          <h2 id="reviews-title" className="font-display text-[clamp(36px,4vw,60px)] leading-none">
            Reviews
          </h2>
          <div className="border-t border-line pt-6">
            <p className="font-display text-2xl">No reviews yet.</p>
            <p className="mt-3 max-w-lg text-[15px] font-light leading-relaxed text-mist">
              Reviews from verified customers appear here, with the size they bought and how it fits.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="related-title" className="border-t border-line">
        <div className="page-x mx-auto max-w-page py-24">
          <h2 id="related-title" className="mb-12 font-display text-[clamp(36px,4vw,60px)] leading-none">
            Complete the look
          </h2>
          <ul className="grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={i * 80}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
