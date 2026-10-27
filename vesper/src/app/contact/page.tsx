import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/editorial/PageHeader";
import { InfoBody, InfoSection } from "@/components/editorial/InfoSection";
import { ContactForm } from "@/components/support/ContactForm";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about an order, sizing, returns or repairs? Write to VESPER client care.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="Help" title="Contact" intro={`Questions about an order, sizing or a repair? ${site.responseTime}`} />
      <InfoBody>
        <InfoSection id="write" title="Write to us">
          <ContactForm />
        </InfoSection>
        <InfoSection id="details" title="Client care">
          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="label text-smoke">Email</dt>
              <dd className="mt-2">
                <a href={`mailto:${site.email}`} className="link-draw text-ivory">{site.email}</a>
              </dd>
            </div>
            <div>
              <dt className="label text-smoke">Hours</dt>
              <dd className="mt-2">{site.hours}</dd>
            </div>
            <div>
              <dt className="label text-smoke">Atelier</dt>
              <dd className="mt-2">{site.city}</dd>
            </div>
          </dl>
        </InfoSection>
        <InfoSection title="Quick answers">
          <ul className="space-y-2">
            <li><Link href="/shipping-returns#delivery" className="link-draw text-ivory">Delivery times and costs</Link></li>
            <li><Link href="/shipping-returns#returns" className="link-draw text-ivory">How to return a piece</Link></li>
            <li><Link href="/size-guide" className="link-draw text-ivory">Finding your size</Link></li>
            <li><Link href="/account" className="link-draw text-ivory">Your orders</Link></li>
          </ul>
        </InfoSection>
      </InfoBody>
    </>
  );
}
