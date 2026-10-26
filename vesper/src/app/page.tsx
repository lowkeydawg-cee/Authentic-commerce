import Link from "next/link";

/**
 * Milestone 1 shell preview. Milestone 2 replaces this with the Cinematic
 * Stage homepage (pinned 3D hero + camera chapters).
 */
export default function HomePage() {
  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-[radial-gradient(ellipse_45%_45%_at_50%_48%,#4A423C_0%,#1D1A18_52%,#0B0B0C_100%)]">
      <div className="page-x mx-auto flex w-full max-w-page flex-col gap-8 pb-16 pt-40 sm:pb-24">
        <p className="label text-smoke">Autumn / Winter — Chapter I</p>
        <h1 className="font-display text-[clamp(52px,8vw,128px)] font-normal leading-[0.98]">
          Dressed for
          <br />
          <em className="text-bronze">the after‑hours.</em>
        </h1>
        <Link
          href="/collections"
          className="label inline-flex min-h-12 items-center self-start bg-ivory px-8 font-semibold text-ink transition-colors duration-quick ease-quiet hover:bg-white"
        >
          Discover the collection
        </Link>
      </div>
    </section>
  );
}
