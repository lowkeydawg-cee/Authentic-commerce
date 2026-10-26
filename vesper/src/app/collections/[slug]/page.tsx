import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionView, type SearchParams } from "@/components/catalog/CollectionView";
import { commerce, type CategorySlug } from "@/lib/commerce";

const EDITS = {
  "the-nocturne": {
    eyebrow: "The campaign",
    title: "The Nocturne",
    intro: "Burnished calf, oxblood and black: the pieces shot for Chapter I, made for the hour after dark.",
  },
  new: {
    eyebrow: "Just in",
    title: "New arrivals",
    intro: "The latest pieces from the atelier, in the order they arrived.",
  },
} as const;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const categories = await commerce.listCategories();
  return [...categories.map((c) => ({ slug: c.slug })), ...Object.keys(EDITS).map((slug) => ({ slug }))];
}

async function resolve(slug: string) {
  if (slug in EDITS) return { kind: "edit" as const, ...EDITS[slug as keyof typeof EDITS] };
  const category = (await commerce.listCategories()).find((c) => c.slug === slug);
  return category ? { kind: "category" as const, eyebrow: "Collection", title: category.title, intro: category.intro } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const page = await resolve((await params).slug);
  return page ? { title: page.title, description: page.intro } : {};
}

export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const page = await resolve(slug);
  if (!page) notFound();
  const base =
    page.kind === "edit"
      ? { edit: slug as keyof typeof EDITS }
      : { category: slug as CategorySlug };
  const sp = await searchParams;
  // "New arrivals" defaults to newest-first.
  if (slug === "new" && !sp.sort) sp.sort = "newest";
  return <CollectionView eyebrow={page.eyebrow} title={page.title} intro={page.intro} base={base} searchParams={sp} />;
}
