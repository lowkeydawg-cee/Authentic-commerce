import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page-x mx-auto flex min-h-[80svh] max-w-page flex-col justify-center gap-6 pt-[var(--header-h)]">
      <p className="label text-smoke">Page not found</p>
      <h1 className="font-display text-5xl sm:text-7xl">
        Lost <em className="text-bronze">after dark.</em>
      </h1>
      <p className="max-w-md text-mist">This page doesn&apos;t exist yet, or has moved. The collection is this way.</p>
      <Link href="/" className="label link-draw self-start">
        Return home
      </Link>
    </section>
  );
}
