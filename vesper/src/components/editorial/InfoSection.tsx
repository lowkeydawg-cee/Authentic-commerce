import { Reveal } from "@/components/home/Reveal";

/** A titled block on a support page: heading on the left, content on the right (stacked on mobile). */
export function InfoSection({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={id && `${id}-title`} className="scroll-mt-24 border-t border-line py-12 lg:grid lg:grid-cols-[1fr_2fr] lg:gap-16 lg:py-16">
      <Reveal>
        <h2 id={id && `${id}-title`} className="font-display text-3xl leading-tight sm:text-4xl">
          {title}
        </h2>
      </Reveal>
      <Reveal delay={80} className="mt-6 space-y-5 text-[16px] font-light leading-relaxed text-mist lg:mt-1">
        {children}
      </Reveal>
    </section>
  );
}

/** Page body wrapper for support pages. */
export function InfoBody({ children }: { children: React.ReactNode }) {
  return <div className="page-x mx-auto max-w-page pb-24 lg:pb-32">{children}</div>;
}
