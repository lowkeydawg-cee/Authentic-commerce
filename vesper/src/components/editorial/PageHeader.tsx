import { Reveal } from "@/components/home/Reveal";

/** The editorial page opening shared by collections, journal and support pages. */
export function PageHeader({ eyebrow, title, intro, children }: { eyebrow: string; title: React.ReactNode; intro?: string; children?: React.ReactNode }) {
  return (
    <header className="page-x mx-auto max-w-page pb-14 pt-[calc(var(--header-h)+72px)] lg:pb-20">
      <Reveal eager>
        <p className="label text-smoke">{eyebrow}</p>
        <h1 className="mt-4 font-display text-[clamp(48px,7vw,112px)] leading-[0.95]">{title}</h1>
        {intro && <p className="mt-6 max-w-xl text-[17px] font-light leading-relaxed text-mist">{intro}</p>}
        {children}
      </Reveal>
    </header>
  );
}
