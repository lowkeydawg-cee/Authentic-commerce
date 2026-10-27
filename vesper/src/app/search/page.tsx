import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Reveal } from "@/components/home/Reveal";
import { ARTICLES } from "@/content/journal";
import { COLOR_FAMILIES, commerce } from "@/lib/commerce";
import { CATEGORIES } from "@/lib/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const SUGGESTIONS = ["Calf", "Suede", "Oxblood", "Loafer", "Wool", "Tote"];

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const q = queryOf(await searchParams);
  return { title: q ? `Search: ${q}` : "Search", robots: { index: false } };
}

function queryOf(sp: Awaited<SearchParams>) {
  const v = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  return (v ?? "").trim().slice(0, 80);
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const q = queryOf(await searchParams);
  const products = q ? await commerce.listProducts({ search: q }) : [];
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const stories = q ? ARTICLES.filter((a) => words.every((w) => `${a.title} ${a.excerpt} ${a.kicker}`.toLowerCase().includes(w))) : [];
  const total = products.length + stories.length;
  // "oxblood" should lead each card with its oxblood colourway.
  const families = COLOR_FAMILIES.filter((f) => words.includes(f.id)).map((f) => f.id);

  return (
    <div className="page-x mx-auto max-w-page pb-24 pt-[calc(var(--header-h)+56px)] lg:pb-32">
      <h1 className="label text-smoke">Search</h1>
      <Form action="/search" role="search" className="mt-6 flex items-center border-b border-line focus-within:border-ivory">
        <label htmlFor="search-q" className="sr-only">
          Search the collection and journal
        </label>
        <input
          id="search-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="What are you looking for?"
          enterKeyHint="search"
          autoComplete="off"
          className="min-h-20 min-w-0 flex-1 bg-transparent font-display text-[clamp(28px,4.4vw,64px)] text-ivory outline-none placeholder:text-smoke"
        />
        <button type="submit" className="label min-h-11 shrink-0 pl-4">
          Search
        </button>
      </Form>

      {q && (
        <p role="status" className="label mt-6 text-smoke">
          {total === 0 ? `No results for “${q}”` : `${total} ${total === 1 ? "result" : "results"} for “${q}”`}
        </p>
      )}

      {!q || total === 0 ? (
        <section aria-labelledby="suggest-title" className="mt-16 grid gap-12 sm:grid-cols-2">
          <h2 id="suggest-title" className="sr-only">
            Suggestions
          </h2>
          <div>
            <p className="label text-smoke">Try</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <Link href={`/search?q=${encodeURIComponent(s.toLowerCase())}`} className="inline-flex min-h-11 items-center border border-line px-4 text-sm text-mist transition-colors duration-quick hover:border-mist hover:text-ivory">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label text-smoke">Or browse</p>
            <ul className="mt-3">
              {CATEGORIES.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className="link-draw tap font-display text-2xl">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <>
          {products.length > 0 && (
            <section aria-labelledby="results-products" className="mt-14">
              <h2 id="results-products" className="label mb-10 text-smoke">
                Pieces ({products.length})
              </h2>
              <ul className="grid gap-x-6 gap-y-16 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((p, i) => (
                  <Reveal as="li" key={p.slug} delay={(i % 3) * 80} eager={i < 3}>
                    <ProductCard product={p} preferFamilies={families} priority={i < 3} />
                  </Reveal>
                ))}
              </ul>
            </section>
          )}
          {stories.length > 0 && (
            <section aria-labelledby="results-stories" className="mt-20 border-t border-line pt-14">
              <h2 id="results-stories" className="label mb-8 text-smoke">
                Journal ({stories.length})
              </h2>
              <ul className="divide-y divide-line border-y border-line">
                {stories.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/journal/${a.slug}`} className="group flex flex-col gap-2 py-6 sm:flex-row sm:items-baseline sm:justify-between">
                      <span className="font-display text-2xl transition-colors duration-quick group-hover:text-bronze sm:text-3xl">{a.title}</span>
                      <span className="label text-smoke">{a.kicker}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
