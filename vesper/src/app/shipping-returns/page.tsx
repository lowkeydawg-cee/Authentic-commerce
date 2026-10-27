import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/editorial/PageHeader";
import { InfoBody, InfoSection } from "@/components/editorial/InfoSection";
import { site } from "@/content/site";
import { COUNTRIES, DELIVERY, PAYMENT, RETURNS } from "@/lib/delivery";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "Shipping & returns",
  description: `Delivery options and costs, payment methods, and how to return a piece within ${RETURNS.days} days.`,
};

const countries = new Intl.ListFormat("en-GB", { type: "conjunction" }).format(COUNTRIES);

export default function ShippingReturnsPage() {
  return (
    <>
      <PageHeader eyebrow="Help" title="Shipping & returns" intro={`Complimentary standard delivery on every order, and ${RETURNS.days} days to change your mind.`} />
      <InfoBody>
        <InfoSection id="delivery" title="Delivery">
          <p>We deliver to {countries}. Every order is packed by hand in Kigali and sent with tracking.</p>
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Delivery options</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="label py-3 pr-4 font-normal text-smoke">Option</th>
                <th scope="col" className="label py-3 pr-4 font-normal text-smoke">Timing</th>
                <th scope="col" className="label py-3 font-normal text-smoke">Cost</th>
              </tr>
            </thead>
            <tbody>
              {DELIVERY.map((d) => (
                <tr key={d.id} className="border-b border-line/60">
                  <th scope="row" className="py-4 pr-4 font-normal text-ivory">{d.label}</th>
                  <td className="py-4 pr-4">{d.note}</td>
                  <td className="py-4 tabular-nums">{d.fee === 0 ? "Complimentary" : formatMoney({ amount: d.fee, currencyCode: "RWF" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>Orders placed before 14:00 on a business day leave the atelier the same day. You&apos;ll receive a tracking link by email as soon as your parcel is on its way.</p>
          <p>For deliveries outside Rwanda, import duties and taxes may be charged by your country on arrival and are paid to the courier.</p>
        </InfoSection>

        <InfoSection id="payment" title="Payment">
          <ul className="space-y-2">
            {PAYMENT.map((p) => (
              <li key={p.id}>
                <span className="text-ivory">{p.label}</span> · {p.note}
              </li>
            ))}
          </ul>
          <p>All prices are shown in Rwandan francs and include VAT. Your payment is taken when you place the order.</p>
        </InfoSection>

        <InfoSection id="returns" title="Returns">
          <p>{RETURNS.summary} Returns are free.</p>
          <ol className="list-decimal space-y-2 pl-5 marker:text-smoke">
            <li>
              Email <a href={`mailto:${site.email}?subject=Return`} className="link-draw text-ivory">{site.email}</a> with your order reference (it starts with VSP-).
            </li>
            <li>In Kigali, we arrange a courier collection at a time that suits you. Elsewhere, we send you a prepaid label.</li>
            <li>Once the piece reaches us and is checked, we refund your original payment method within 5 business days.</li>
          </ol>
          <p>Prefer a different size or colour? Say so in your email and we&apos;ll send the exchange as soon as the return is collected.</p>
        </InfoSection>

        <InfoSection id="repairs" title="Repairs & resoling">
          <p>
            Our soles are stitched, not glued, so they can be replaced. When yours wear through, <Link href="/contact" className="link-draw text-ivory">contact us</Link> and we&apos;ll arrange the resoling, or recommend a cobbler near you.
          </p>
        </InfoSection>
      </InfoBody>
    </>
  );
}
