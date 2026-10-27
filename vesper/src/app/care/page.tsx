import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/editorial/PageHeader";
import { InfoBody, InfoSection } from "@/components/editorial/InfoSection";
import { commerce, type Product } from "@/lib/commerce";

export const metadata: Metadata = {
  title: "Care",
  description: "How to care for calf, suede, jersey, waxed cotton and wool, so each piece looks better with time.",
};

/** Care guides by material, built from the care notes on each product so the two never drift apart. */
const MATERIALS: { id: string; title: string; intro: string; match: (p: Product) => boolean }[] = [
  { id: "calf", title: "Calf leather shoes", intro: "Burnished calf deepens in colour with wear. Keep it clean and supple, and it will outlast the sole.", match: (p) => (p.category === "sneakers" || p.category === "shoes") && !p.material.toLowerCase().includes("suede") },
  { id: "suede", title: "Suede", intro: "Suede wants a brush, not a cloth. Never use cream or water on it.", match: (p) => p.material.toLowerCase().startsWith("suede") },
  { id: "jersey", title: "Cotton jersey", intro: "Heavyweight jersey keeps its shape if it is washed cool and dried flat.", match: (p) => p.category === "t-shirts" },
  { id: "outerwear", title: "Outerwear", intro: "Waxed cotton and brushed wool are cared for very differently; follow the notes for your piece.", match: (p) => p.category === "jackets" },
  { id: "leather-goods", title: "Leather goods", intro: "Painted edges and calf need only a dry cloth and the occasional conditioning.", match: (p) => p.category === "accessories" },
];

export default async function CarePage() {
  const products = await commerce.listProducts();
  return (
    <>
      <PageHeader eyebrow="Help" title="Care" intro="A few minutes now and then keeps each piece looking better at year five than on day one." />
      <InfoBody>
        {MATERIALS.map((m) => {
          const items = products.filter(m.match);
          // Pieces in the same group can share care notes; group them so each set of instructions appears once.
          const sets = new Map<string, Product[]>();
          for (const p of items) sets.set(p.care.join("|"), [...(sets.get(p.care.join("|")) ?? []), p]);
          return (
            <InfoSection key={m.id} id={m.id} title={m.title}>
              <p>{m.intro}</p>
              {[...sets.values()].map((group) => (
                <div key={group[0].slug} className="border-t border-line/60 pt-5">
                  <p className="label text-smoke">
                    {group.map((p, i) => (
                      <span key={p.slug}>
                        {i > 0 && ", "}
                        <Link href={`/products/${p.slug}`} className="link-draw hover:text-ivory">
                          {p.title}
                        </Link>
                      </span>
                    ))}
                  </p>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-smoke">
                    {group[0].care.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </InfoSection>
          );
        })}
        <InfoSection title="Read more">
          <p>
            Our journal has a longer guide: <Link href="/journal/caring-for-calf" className="link-draw text-ivory">A short guide to caring for calf</Link>.
          </p>
        </InfoSection>
      </InfoBody>
    </>
  );
}
