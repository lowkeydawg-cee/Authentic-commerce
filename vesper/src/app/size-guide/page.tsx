import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/editorial/PageHeader";
import { InfoBody, InfoSection } from "@/components/editorial/InfoSection";
import { SizeTable } from "@/components/editorial/SizeTable";
import { commerce } from "@/lib/commerce";
import { APPAREL_SIZES, FOOTWEAR_SIZES } from "@/lib/fit";

export const metadata: Metadata = {
  title: "Size guide",
  description: "Footwear and apparel size charts, how to measure, and the fit of every VESPER piece.",
};

export default async function SizeGuidePage() {
  const products = await commerce.listProducts();
  const groups = [
    { title: "Footwear fit", items: products.filter((p) => p.category === "sneakers" || p.category === "shoes") },
    { title: "Apparel fit", items: products.filter((p) => p.category === "t-shirts" || p.category === "jackets") },
  ];
  return (
    <>
      <PageHeader eyebrow="Help" title="Size guide" intro="Our footwear uses EU sizing; apparel runs from XS to XL. Each product page also carries its own fit note." />
      <InfoBody>
        <InfoSection id="footwear" title="Footwear">
          <SizeTable kind="footwear" />
          <p>
            <span className="text-ivory">How to measure: </span>
            {FOOTWEAR_SIZES.howTo}
          </p>
        </InfoSection>
        <InfoSection id="apparel" title="Apparel">
          <SizeTable kind="apparel" />
          <p>
            <span className="text-ivory">How to measure: </span>
            {APPAREL_SIZES.howTo}
          </p>
        </InfoSection>
        {groups.map((g) => (
          <InfoSection key={g.title} title={g.title}>
            <dl className="divide-y divide-line/60 border-y border-line/60">
              {g.items.map((p) => (
                <div key={p.slug} className="grid gap-1 py-4 sm:grid-cols-[200px_1fr] sm:gap-6">
                  <dt>
                    <Link href={`/products/${p.slug}`} className="link-draw text-ivory">
                      {p.title}
                    </Link>
                  </dt>
                  <dd>{p.fit}</dd>
                </div>
              ))}
            </dl>
          </InfoSection>
        ))}
        <InfoSection title="Still unsure?">
          <p>
            Tell us your usual size in another brand and we will recommend one. <Link href="/contact" className="link-draw text-ivory">Contact client care</Link>, or order two sizes and return the one that doesn&apos;t fit, free of charge.
          </p>
        </InfoSection>
      </InfoBody>
    </>
  );
}
