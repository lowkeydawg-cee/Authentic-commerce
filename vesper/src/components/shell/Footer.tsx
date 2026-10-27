import Link from "next/link";
import { CATEGORIES, HOUSE_LINKS, SUPPORT_LINKS, type NavLink } from "@/lib/navigation";
import { NewsletterForm } from "./NewsletterForm";

function Column({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <div>
      <h2 className="label mb-5 text-smoke">{title}</h2>
      <ul className="space-y-1">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="link-draw tap text-[15px] text-mist hover:text-ivory">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="page-x mx-auto grid max-w-page gap-14 py-20 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-md">
          <p className="font-display text-3xl leading-tight sm:text-4xl">
            Letters <em className="text-bronze">after dark.</em>
          </p>
          <p className="mt-4 text-[15px] font-light leading-relaxed text-mist">
            New chapters, atelier stories and early access to each release.
          </p>
          <NewsletterForm />
        </div>
        <Column title="Shop" links={CATEGORIES} />
        <Column title="Help" links={SUPPORT_LINKS} />
        <Column title="The house" links={HOUSE_LINKS} />
      </div>
      <div className="page-x mx-auto flex max-w-page flex-wrap items-center justify-between gap-4 border-t border-line py-8">
        <span className="font-display tracking-wordmark">VESPER</span>
        <p className="label text-smoke">© {new Date().getFullYear()} VESPER</p>
      </div>
    </footer>
  );
}
