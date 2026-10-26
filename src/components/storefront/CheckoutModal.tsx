"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, CreditCard, Lock, PartyPopper, Smartphone, Truck } from "lucide-react";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { formatMoney } from "@/lib/format";
import type { CustomerDetails, Order, PaymentMethod, StockConflict } from "@/lib/types";
import { useCart } from "@/store/cart";
import { useInventory } from "@/store/inventory";
import { toast } from "@/store/toast";

const STEPS = ["Delivery", "Payment", "Review"] as const;
type Step = 0 | 1 | 2 | 3; // 3 = confirmation

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; hint: string; icon: React.ReactNode }[] = [
  { id: "mtn_momo", label: "MTN Mobile Money", hint: "Approve the prompt on your phone", icon: <Smartphone className="h-5 w-5" /> },
  { id: "airtel_money", label: "Airtel Money", hint: "Approve the prompt on your phone", icon: <Smartphone className="h-5 w-5" /> },
  { id: "card", label: "Credit / debit card", hint: "Visa, Mastercard", icon: <CreditCard className="h-5 w-5" /> },
];

const EMPTY_CUSTOMER: CustomerDetails = { fullName: "", email: "", phone: "", address: "", city: "Kigali" };

function validateCustomer(c: CustomerDetails) {
  const errors: Partial<Record<keyof CustomerDetails, string>> = {};
  if (c.fullName.trim().length < 2) errors.fullName = "Please enter your full name";
  if (!/^\S+@\S+\.\S+$/.test(c.email)) errors.email = "Enter a valid email";
  if (c.phone.replace(/\D/g, "").length < 9) errors.phone = "Enter a valid phone number";
  if (c.address.trim().length < 4) errors.address = "Enter a delivery address";
  if (c.city.trim().length < 2) errors.city = "Enter a city";
  return errors;
}

const slide = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export function CheckoutModal() {
  const { checkoutOpen, setCheckoutOpen, lines, clear, reconcile } = useCart();
  const { products, settings, repo } = useInventory();
  const [step, setStep] = useState<Step>(0);
  const [direction, setDirection] = useState(1);
  const [customer, setCustomer] = useState<CustomerDetails>(EMPTY_CUSTOMER);
  const [touched, setTouched] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>("mtn_momo");
  const [cardNumber, setCardNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [conflicts, setConflicts] = useState<StockConflict[]>([]);
  const [order, setOrder] = useState<Order | null>(null);

  const items = useMemo(
    () =>
      lines.flatMap((l) => {
        const product = products.find((p) => p.id === l.productId);
        return product ? [{ product, quantity: l.quantity }] : [];
      }),
    [lines, products],
  );
  const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const errors = validateCustomer(customer);
  const money = (n: number) => formatMoney(n, settings.currency);

  const go = (next: Step) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const close = () => {
    if (submitting) return;
    setCheckoutOpen(false);
    // Reset after the exit animation so the user doesn't see it snap back.
    setTimeout(() => {
      setStep(0);
      setConflicts([]);
      setOrder(null);
      setTouched(false);
    }, 300);
  };

  const submit = async () => {
    setSubmitting(true);
    setConflicts([]);
    try {
      const result = await repo.placeOrder(
        items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        customer,
        payment,
      );
      if (result.ok) {
        setOrder(result.order);
        clear();
        go(3);
      } else {
        setConflicts(result.conflicts);
        reconcile(new Map(result.conflicts.map((c) => [c.productId, c.available])));
        toast({ tone: "warning", title: "Stock changed", description: result.message });
      }
    } catch (e) {
      toast({ tone: "error", title: "Payment failed", description: e instanceof Error ? e.message : "Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const update = (key: keyof CustomerDetails) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCustomer((c) => ({ ...c, [key]: e.target.value }));

  return (
    <Modal open={checkoutOpen} onClose={close} locked={submitting} title={step < 3 ? "Secure checkout" : undefined} className="sm:max-w-2xl">
      {step < 3 && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex items-center gap-2">
                  <motion.span
                    animate={{
                      backgroundColor: i <= step ? "rgb(224 187 99)" : "rgba(255,255,255,0.06)",
                      color: i <= step ? "#07070b" : "rgba(255,255,255,0.5)",
                      scale: i === step ? 1.1 : 1,
                    }}
                    className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold"
                  >
                    {i < step ? <Check className="h-4 w-4" /> : i + 1}
                  </motion.span>
                  <span className={clsx("hidden text-sm sm:inline", i <= step ? "text-white" : "text-white/40")}>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="mx-3 h-px flex-1 overflow-hidden bg-white/10">
                    <motion.div className="h-full bg-gold-400" initial={false} animate={{ width: i < step ? "100%" : "0%" }} transition={{ duration: 0.5 }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {step === 0 && (
            <motion.div key="delivery" custom={direction} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" name="fullName" autoComplete="name" value={customer.fullName} onChange={update("fullName")} error={touched ? errors.fullName : undefined} />
                <Field label="Email" name="email" type="email" autoComplete="email" value={customer.email} onChange={update("email")} error={touched ? errors.email : undefined} />
                <Field label="Phone" name="phone" type="tel" autoComplete="tel" placeholder="+250 7XX XXX XXX" value={customer.phone} onChange={update("phone")} error={touched ? errors.phone : undefined} />
                <Field label="City" name="city" autoComplete="address-level2" value={customer.city} onChange={update("city")} error={touched ? errors.city : undefined} />
                <Field label="Delivery address" name="address" autoComplete="street-address" placeholder="KG 7 Ave, Kacyiru" className="sm:col-span-2" value={customer.address} onChange={update("address")} error={touched ? errors.address : undefined} />
              </div>
              <div className="mt-8 flex items-center justify-between">
                <p className="flex items-center gap-2 text-xs text-white/40"><Truck className="h-4 w-4" /> Free delivery, 1–2 days in Kigali</p>
                <Button
                  onClick={() => {
                    setTouched(true);
                    if (Object.keys(errors).length === 0) go(1);
                  }}
                >
                  Continue to payment
                </Button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="payment" custom={direction} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div className="space-y-3">
                {PAYMENT_OPTIONS.map((opt) => {
                  const active = payment === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPayment(opt.id)}
                      className={clsx(
                        "relative flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors",
                        active ? "border-gold-300/60 bg-gold-300/[0.06]" : "border-white/10 bg-white/[0.02] hover:border-white/20",
                      )}
                    >
                      <span className={clsx("grid h-10 w-10 place-items-center rounded-full", active ? "bg-gold-400 text-ink-950" : "bg-white/5 text-white/60")}>{opt.icon}</span>
                      <span className="flex-1">
                        <span className="block font-medium">{opt.label}</span>
                        <span className="block text-xs text-white/45">{opt.hint}</span>
                      </span>
                      <span className={clsx("grid h-5 w-5 place-items-center rounded-full border", active ? "border-gold-300" : "border-white/20")}>
                        {active && <motion.span layoutId="pay-dot" className="h-2.5 w-2.5 rounded-full bg-gold-300" />}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              <AnimatePresence>
                {payment === "card" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <Field
                      label="Card number (demo — not charged)"
                      name="card"
                      inputMode="numeric"
                      placeholder="4242 4242 4242 4242"
                      className="mt-4"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/[^\d ]/g, "").slice(0, 19))}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => go(0)}><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button
                  onClick={() => go(2)}
                  disabled={payment === "card" && cardNumber.replace(/\D/g, "").length < 12}
                >
                  Review order
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="review" custom={direction} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <AnimatePresence>
                {conflicts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }}
                    exit={{ opacity: 0 }}
                    className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100"
                  >
                    <p className="font-medium">Some items sold out while you were checking out:</p>
                    <ul className="mt-2 space-y-1 text-amber-100/80">
                      {conflicts.map((c) => (
                        <li key={c.productId}>
                          {c.title}: requested {c.requested}, {c.available} available
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-amber-100/70">We&apos;ve adjusted your cart. Review and place your order again.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="divide-y divide-white/5 rounded-2xl border border-white/10">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                    <span className="min-w-0 truncate">
                      {product.title} <span className="text-white/40">× {quantity}</span>
                    </span>
                    <span className="shrink-0 tabular-nums">{money(product.price * quantity)}</span>
                  </div>
                ))}
                {items.length === 0 && <p className="p-4 text-sm text-white/50">Your cart is empty.</p>}
              </div>

              <div className="mt-4 grid gap-1 rounded-2xl bg-white/[0.03] p-4 text-sm text-white/60">
                <p><span className="text-white/40">Deliver to:</span> {customer.fullName}, {customer.address}, {customer.city}</p>
                <p><span className="text-white/40">Pay with:</span> {PAYMENT_OPTIONS.find((o) => o.id === payment)?.label}</p>
              </div>

              <div className="mt-6 flex items-baseline justify-between">
                <span className="text-white/60">Total</span>
                <span className="font-display text-3xl text-gold-200">{money(total)}</span>
              </div>

              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => go(1)} disabled={submitting}><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button size="lg" onClick={submit} loading={submitting} disabled={items.length === 0}>
                  {!submitting && <Lock className="h-4 w-4" />}
                  {submitting ? "Processing payment…" : `Pay ${money(total)}`}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && order && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-4 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
                className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-300 to-emerald-500 text-ink-950 shadow-[0_0_60px_-10px_rgba(52,211,153,0.7)]"
              >
                <Check className="h-10 w-10" strokeWidth={3} />
              </motion.div>
              <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6 flex items-center justify-center gap-2 font-display text-3xl">
                Order confirmed <PartyPopper className="h-6 w-6 text-gold-300" />
              </motion.h3>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-2 text-white/60">
                Murakoze, {order.customer.fullName.split(" ")[0]}! A receipt is on its way to {order.customer.email}.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass mx-auto mt-6 max-w-sm rounded-2xl p-4 text-sm">
                <div className="flex justify-between"><span className="text-white/50">Reference</span><span className="font-mono">{order.reference}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-white/50">Total paid</span><span>{money(order.total)}</span></div>
              </motion.div>
              <Button className="mt-8" onClick={close}>Continue shopping</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
