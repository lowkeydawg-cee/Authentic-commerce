import type { Metadata } from "next";
import { CollectionView, type SearchParams } from "@/components/catalog/CollectionView";

export const metadata: Metadata = {
  title: "The collection",
  description: "Sneakers, shoes, T‑shirts, jackets and accessories from VESPER.",
};

export default async function CollectionPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <CollectionView
      eyebrow="Autumn / Winter"
      title="The collection"
      intro="Everything from the current chapter: footwear, outerwear, jersey and leather goods, each one built to be turned over in 3D."
      base={{}}
      searchParams={await searchParams}
    />
  );
}
