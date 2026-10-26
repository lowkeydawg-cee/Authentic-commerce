import Link from "next/link";
import { Poster } from "@/components/media/Poster";
import { hero } from "@/content/home";

/**
 * Layout 1 · Cinematic Stage hero. The product sits centre stage; the 3D model
 * mounts into the stage slot in milestone 5, with this poster as its fallback.
 */
export function StageHero() {
  return (
    <section aria-labelledby="hero-title" className="relative flex min-h-[640px] flex-col overflow-hidden h-[100svh]">
      <div className="anim-stage absolute inset-0" style={{ animationDelay: "100ms" }}>
        <Poster shot={hero.shot} src={hero.src} tone="ink" priority quiet className="h-full w-full" />
      </div>

      <h1 id="hero-title" className="relative flex flex-1 flex-col justify-between font-display font-normal leading-[0.98]">
        <span className="page-x block overflow-hidden pt-[calc(var(--header-h)+6vh)]">
          <span className="anim-line block text-[clamp(48px,7.6vw,128px)]" style={{ animationDelay: "350ms" }}>
            {hero.headlineTop}
          </span>
        </span>
        <span className="page-x block overflow-hidden pb-[22vh] text-right sm:pb-[18vh]">
          <em className="anim-line block text-[clamp(48px,7.6vw,128px)] text-bronze" style={{ animationDelay: "430ms" }}>
            {hero.headlineBottom}
          </em>
        </span>
      </h1>

      <div className="page-x absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-6 pb-8 sm:pb-12">
        <div className="anim-fade flex flex-wrap items-center gap-x-6 gap-y-3" style={{ animationDelay: "1100ms" }}>
          <Link
            href={hero.cta.href}
            className="label inline-flex min-h-12 items-center bg-ivory px-8 font-semibold text-ink transition-colors duration-quick ease-quiet hover:bg-white"
          >
            {hero.cta.label}
          </Link>
          <Link href={hero.product.href} className="link-draw text-[15px] text-mist hover:text-ivory">
            {hero.product.name} — explore in 3D
          </Link>
        </div>
        <p className="label anim-fade hidden text-smoke sm:block" style={{ animationDelay: "1300ms" }}>
          {hero.eyebrow} · Scroll ↓
        </p>
      </div>
    </section>
  );
}
