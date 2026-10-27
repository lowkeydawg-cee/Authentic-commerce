import type { MetadataRoute } from "next";
import { ARTICLES } from "@/content/journal";
import { SITE_URL } from "@/content/site";
import { commerce } from "@/lib/commerce";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([commerce.listCategories(), commerce.listProducts()]);
  const pages = ["", "/collections", "/collections/new", "/collections/the-nocturne", "/journal", "/size-guide", "/shipping-returns", "/care", "/contact"];
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}` })),
    ...categories.map((c) => ({ url: `${SITE_URL}/collections/${c.slug}` })),
    ...products.map((p) => ({ url: `${SITE_URL}/products/${p.slug}`, images: p.colorways.map((c) => `${SITE_URL}${c.images.front}`) })),
    ...ARTICLES.map((a) => ({ url: `${SITE_URL}/journal/${a.slug}`, lastModified: a.publishedAt })),
  ];
}
