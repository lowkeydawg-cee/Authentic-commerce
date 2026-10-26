"use client";

import Link from "next/link";
import clsx from "clsx";
import { useEffect, useId, useRef, useState } from "react";
import { saveOrder, orderReference, type DemoOrder } from "@/lib/cart/orders";
import { resolveLines, subtotal, type ResolvedLine } from "@/lib/cart/resolve";
import { bag, useBag } from "@/lib/cart/store";
import type { Money } from "@/lib/commerce/types";
import { formatMoney } from "@/lib/format";
import { BagLines } from "./BagLines";

const STEPS = ["Details", "Delivery", "Payment", "Confirmation"] as const;

/** Sample delivery options for the prototype; real rates come from the commerce platform. */
const DELIVERY = [
  { id: "standard", label: "Standard delivery", note: "2–4 business days", fee: 0 },
  { id: "express", label: "Express courier", note: "Next business day in Kigali", fee: 10000 },
] as const;

const PAYMENT = [
  { id: "card", label: "Card", note: "Visa, Mastercard" },
  { id: "mtn", label: "MTN Mobile Money", note: "Approve on your phone" },
  { id: "airtel", label: "Airtel Money", note: "Approve on your phone" },
] as const;

const COUNTRIES = ["Rwanda", "Burundi", "Democratic Republic of the Congo", "Kenya", "Tanzania", "Uganda"];

interface Form {
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  delivery: (typeof DELIVERY)[number]["id"];
  payment: (typeof PAYMENT)[number]["id"];
}

type Errors = Partial<Record<keyof Form, string>>;

function validate(step: number, f: Form): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email address.";
    if (f.name.trim().length < 2) e.name = "Enter your full name.";
    if (f.phone.replace(/\D/g, "").length < 9) e.phone = "Enter a phone number, including the country code.";
  }
  if (step === 1) {
    if (f.address.trim().length < 4) e.address = "Enter a delivery address.";
    if (f.city.trim().length < 2) e.city = "Enter a city.";
  }
  return e;
}

/**
 * Step 3 · checkout: Details → Delivery → Payment → Confirmation, with the
 * order summary always visible. Payment is a clearly marked DEMO: no card or
 * wallet data is collected and nothing is charged.
 */
export function CheckoutFlow() {
  const lines = resolveLines(useBag());
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>({ email: "", name: "", phone: "+250 ", address: "", city: "Kigali", country: "Rwanda", delivery: "standard", payment: "card" });
  const [errors, setErrors] = useState<Errors>({});
  const [placing, setPlacing] = useState(false);
  const [order, setOrder] = useState<{ record: DemoOrder; lines: ResolvedLine[]; delivery: Money } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const id = useId();

  // Move focus to the new step's heading so screen readers announce it.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [step]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(step, form);
    setErrors(found);
    const firstBad = Object.keys(found)[0];
    if (firstBad) {
      document.getElementById(`${id}-${firstBad}`)?.focus();
      return;
    }
    setStep((s) => s + 1);
  };

  const deliveryOption = DELIVERY.find((d) => d.id === form.delivery)!;
  const sub = subtotal(order?.lines ?? lines);
  const deliveryFee: Money = order?.delivery ?? { amount: deliveryOption.fee, currencyCode: sub.currencyCode };
  const total: Money = { amount: sub.amount + deliveryFee.amount, currencyCode: sub.currencyCode };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacing(true);
    // Simulated authorisation latency for the demo payment.
    await new Promise((r) => setTimeout(r, 900));
    const record: DemoOrder = {
      reference: orderReference(),
      createdAt: new Date().toISOString(),
      email: form.email,
      name: form.name,
      lines: lines.map((l) => l.line),
      total,
      delivery: deliveryOption.label,
      payment: PAYMENT.find((p) => p.id === form.payment)!.label,
    };
    saveOrder(record);
    setOrder({ record, lines, delivery: deliveryFee });
    bag.clear();
    setPlacing(false);
    setStep(3);
  };

  if (lines.length === 0 && !order) {
    return (
      <div className="page-x mx-auto flex min-h-[70svh] max-w-page flex-col items-start justify-center gap-5 pt-[var(--header-h)]">
        <h1 className="font-display text-5xl">Your bag is empty.</h1>
        <Link href="/collections" className="label link-draw">
          Discover the collection
        </Link>
      </div>
    );
  }

  const field = (key: keyof Form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`${id}-${key}`} className="label text-mist">
        {label}
      </label>
      <input
        id={`${id}-${key}`}
        value={form[key]}
        onChange={(e) => set(key, e.target.value as Form[typeof key])}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `${id}-${key}-error` : undefined}
        className={clsx(
          "mt-2 block min-h-12 w-full border bg-transparent px-4 text-[15px] text-ivory outline-none transition-colors duration-quick focus:border-ivory",
          errors[key] ? "border-[#E39A9D]" : "border-line",
        )}
        {...props}
      />
      {errors[key] && (
        <p id={`${id}-${key}-error`} className="mt-2 text-sm text-[#E39A9D]">
          {errors[key]}
        </p>
      )}
    </div>
  );

  const choice = <K extends "delivery" | "payment">(key: K, options: readonly { id: Form[K]; label: string; note: string; fee?: number }[]) => (
    <div className="space-y-3">
      {options.map((o) => (
        <label
          key={o.id}
          className={clsx(
            "flex min-h-16 cursor-pointer items-center gap-4 border px-5 py-4 transition-colors duration-quick has-[:focus-visible]:outline has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ivory",
            form[key] === o.id ? "border-ivory" : "border-line hover:border-mist",
          )}
        >
          <input type="radio" name={`${id}-${key}`} value={o.id} checked={form[key] === o.id} onChange={() => set(key, o.id)} className="sr-only" />
          <span aria-hidden="true" className={clsx("grid h-5 w-5 shrink-0 place-items-center rounded-full border", form[key] === o.id ? "border-ivory" : "border-smoke")}>
            {form[key] === o.id && <span className="h-2.5 w-2.5 rounded-full bg-ivory" />}
          </span>
          <span className="flex-1">
            <span className="block text-[15px]">{o.label}</span>
            <span className="block text-sm text-mist">{o.note}</span>
          </span>
          {o.fee !== undefined && (
            <span className="text-[15px] tabular-nums">{o.fee === 0 ? "Complimentary" : formatMoney({ amount: o.fee, currencyCode: sub.currencyCode })}</span>
          )}
        </label>
      ))}
    </div>
  );

  const backButton = (
    <button type="button" onClick={() => setStep((s) => s - 1)} className="label link-draw min-h-12 text-mist hover:text-ivory">
      ← Back
    </button>
  );
  const primary = "label inline-flex min-h-14 items-center justify-center bg-ivory px-10 font-semibold text-ink transition-colors duration-quick hover:bg-white disabled:opacity-60";

  return (
    <div className="page-x mx-auto max-w-page pb-24 pt-[calc(var(--header-h)+40px)]">
      <ol aria-label="Checkout steps" className="mb-12 flex flex-wrap gap-x-8 gap-y-3 border-b border-line pb-6">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? "step" : undefined}
            className={clsx("label flex items-center gap-3", i === step ? "text-ivory" : i < step ? "text-mist" : "text-smoke")}
          >
            <span className={clsx("grid h-7 w-7 place-items-center rounded-full border text-[11px] tracking-normal", i === step ? "border-ivory" : "border-line")}>
              {i < step ? "✓" : i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)] lg:items-start">
        <div key={step} className="anim-fade-quick min-w-0">
          {step === 0 && (
            <form onSubmit={next} noValidate className="space-y-6">
              <h1 ref={headingRef} tabIndex={-1} className="font-display text-4xl outline-none sm:text-5xl">Your details</h1>
              <p className="text-sm text-mist">Guest checkout. You can create an account after your order.</p>
              {field("email", "Email", { type: "email", autoComplete: "email", required: true })}
              {field("name", "Full name", { autoComplete: "name", required: true })}
              {field("phone", "Phone", { type: "tel", autoComplete: "tel", required: true })}
              <div className="flex justify-end pt-4">
                <button type="submit" className={primary}>Continue to delivery</button>
              </div>
            </form>
          )}

          {step === 1 && (
            <form onSubmit={next} noValidate className="space-y-6">
              <h1 ref={headingRef} tabIndex={-1} className="font-display text-4xl outline-none sm:text-5xl">Delivery</h1>
              {field("address", "Address", { autoComplete: "street-address", required: true, placeholder: "KG 7 Ave, Kacyiru" })}
              <div className="grid gap-6 sm:grid-cols-2">
                {field("city", "City", { autoComplete: "address-level2", required: true })}
                <div>
                  <label htmlFor={`${id}-country`} className="label text-mist">Country</label>
                  <select
                    id={`${id}-country`}
                    value={form.country}
                    onChange={(e) => set("country", e.target.value)}
                    autoComplete="country-name"
                    className="mt-2 block min-h-12 w-full border border-line bg-ink px-4 text-[15px] text-ivory outline-none focus:border-ivory"
                  >
                    {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <fieldset className="space-y-3 pt-2">
                <legend className="label mb-3 text-mist">Delivery method</legend>
                {choice("delivery", DELIVERY)}
              </fieldset>
              <div className="flex items-center justify-between pt-4">
                {backButton}
                <button type="submit" className={primary}>Continue to payment</button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={placeOrder} className="space-y-6">
              <h1 ref={headingRef} tabIndex={-1} className="font-display text-4xl outline-none sm:text-5xl">Payment</h1>
              <p className="border border-bronze/50 bg-bronze/10 p-4 text-sm leading-relaxed text-ivory">
                <strong className="font-medium">Demo payment.</strong> This prototype isn&apos;t connected to a payment provider yet. No card or
                wallet details are collected and nothing will be charged.
              </p>
              <fieldset>
                <legend className="label mb-3 text-mist">Payment method</legend>
                {choice("payment", PAYMENT)}
              </fieldset>
              <p className="text-sm text-mist">
                {form.payment === "card"
                  ? "In the live store, card details are entered in the payment provider's secure form."
                  : `In the live store, a payment request is sent to ${form.phone.trim() || "your phone"} to approve.`}
              </p>
              <div className="flex items-center justify-between pt-4">
                {backButton}
                <button type="submit" disabled={placing} aria-busy={placing} className={primary}>
                  {placing ? "Placing order…" : `Place order · ${formatMoney(total)}`}
                </button>
              </div>
            </form>
          )}

          {step === 3 && order && (
            <section className="space-y-6">
              <h1 ref={headingRef} tabIndex={-1} className="font-display text-4xl outline-none sm:text-6xl">
                Thank you, <em className="text-bronze">{order.record.name.split(" ")[0]}.</em>
              </h1>
              <p className="text-[17px] font-light leading-relaxed text-mist">
                Your order <span className="tabular-nums text-ivory">{order.record.reference}</span> is confirmed. This was a demo order: no
                payment was taken and no email is sent from the prototype.
              </p>
              <dl className="grid gap-4 border-y border-line py-6 text-[15px] sm:grid-cols-2">
                <div><dt className="label text-smoke">Delivery</dt><dd className="mt-1">{order.record.delivery}</dd></div>
                <div><dt className="label text-smoke">Payment</dt><dd className="mt-1">{order.record.payment} (demo)</dd></div>
                <div><dt className="label text-smoke">Ship to</dt><dd className="mt-1">{form.address}, {form.city}, {form.country}</dd></div>
                <div><dt className="label text-smoke">Confirmation to</dt><dd className="mt-1">{order.record.email}</dd></div>
              </dl>
              <Link href="/collections" className={primary}>Continue shopping</Link>
            </section>
          )}
        </div>

        <aside aria-labelledby={`${id}-summary`} className="border border-line p-6 lg:sticky lg:top-[calc(var(--header-h)+24px)]">
          <h2 id={`${id}-summary`} className="label mb-4 text-mist">Order summary</h2>
          <BagLines lines={order?.lines ?? lines} compact readOnly />
          <dl className="mt-6 space-y-3 text-[15px]">
            <div className="flex justify-between"><dt className="text-mist">Subtotal</dt><dd className="tabular-nums">{formatMoney(sub)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-mist">Delivery</dt>
              <dd className="tabular-nums">{deliveryFee.amount === 0 ? "Complimentary" : formatMoney(deliveryFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-4 text-lg"><dt>Total</dt><dd className="tabular-nums">{formatMoney(total)}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
