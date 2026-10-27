import Link from "next/link";
import { Poster } from "@/components/media/Poster";
import { categories } from "@/content/home";
import { Reveal } from "./Reveal";

export function CategoryTiles() {
  return (
    <section aria-labelledby="categories-title" className="page-x mx-auto max-w-page py-24 lg:py-32">
      <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <h2 id="categories-title" className="font-display text-[clamp(40px,4.6vw,72px)] leading-none">
          Shop by category
        </h2>
        <Link href="/collections" className="label link-draw tap text-mist hover:text-ivory">
          View everything
        </Link>
      </Reveal>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-5 xl:gap-6">
        {categories.map((c, i) => (
          <Reveal as="li" key={c.href} variant="wipe" delay={i * 80}>
            <Link href={c.href} className="group block">
              <div className="overflow-hidden">
                <Poster
                  shot={c.shot}
                  src={c.src}
                  tone={c.tone}
                  quiet
                  sizes="(min-width: 1280px) 20vw, (min-width: 640px) 33vw, 50vw"
                  className="aspect-[3/4] transition-transform duration-standard ease-glide group-hover:scale-[1.03]"
                />
              </div>
              <span className="link-draw mt-4 inline-block font-display text-2xl group-hover:bg-[length:100%_1px]">
                {c.label}
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
