import type { Metadata } from "next";
import { PageHeader } from "@/components/editorial/PageHeader";
import { Reveal } from "@/components/home/Reveal";
import { ArticleCard } from "@/components/journal/ArticleCard";
import { listArticles } from "@/content/journal";

export const metadata: Metadata = {
  title: "Journal",
  description: "Stories from the atelier: the leathers, the stitching, the care, and the collections as they are made.",
};

export default function JournalPage() {
  const [lead, ...rest] = listArticles();
  return (
    <>
      <PageHeader eyebrow="Journal" title={<>Notes <br className="sm:hidden" /><em className="text-bronze">after dark.</em></>} intro="Stories from the atelier: leathers, stitching, care, and each collection as it is made." />
      <div className="page-x mx-auto max-w-page pb-24 lg:pb-32">
        <Reveal eager>
          <ArticleCard article={lead} featured priority />
        </Reveal>
        <h2 className="sr-only">More from the journal</h2>
        <ul className="mt-20 grid gap-x-8 gap-y-16 border-t border-line pt-16 md:grid-cols-2 lg:mt-28 lg:grid-cols-3">
          {rest.map((a, i) => (
            <Reveal as="li" key={a.slug} delay={(i % 3) * 100}>
              <ArticleCard article={a} />
            </Reveal>
          ))}
        </ul>
      </div>
    </>
  );
}
