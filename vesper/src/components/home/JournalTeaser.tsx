import Link from "next/link";
import { journal } from "@/content/home";
import { Reveal } from "./Reveal";

export function JournalTeaser() {
  return (
    <section aria-labelledby="journal-title" className="border-t border-line">
      <div className="page-x mx-auto grid max-w-page gap-12 py-24 lg:grid-cols-[2fr_1fr] lg:items-end lg:py-32">
        <Reveal>
          <h2 id="journal-title" className="sr-only">
            From the journal
          </h2>
          <blockquote className="font-display text-[clamp(32px,3.8vw,60px)] italic leading-[1.15]">
            “{journal.quote}”
          </blockquote>
        </Reveal>
        <Reveal delay={120} className="flex flex-col gap-6">
          <p className="text-base font-light leading-relaxed text-mist">{journal.body}</p>
          <Link href={journal.link.href} className="label link-draw self-start">
            {journal.link.label}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
