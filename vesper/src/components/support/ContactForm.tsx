"use client";

import clsx from "clsx";
import { useId, useRef, useState } from "react";
import { site } from "@/content/site";

const TOPICS = ["An order", "Sizing and fit", "Returns and exchanges", "Repairs and resoling", "Something else"] as const;

type Field = "name" | "email" | "message";

/**
 * Writes the message into the visitor's own email app (mailto), so nothing is
 * stored or sent by the site. Replace with a form endpoint or helpdesk API later.
 */
export function ContactForm() {
  const id = useId();
  const [form, setForm] = useState({ name: "", email: "", topic: TOPICS[0] as string, reference: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [sent, setSent] = useState(false);
  const status = useRef<HTMLParagraphElement>(null);

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (form.name.trim().length < 2) next.name = "Enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (form.message.trim().length < 10) next.message = "Tell us a little more (at least 10 characters).";
    setErrors(next);
    const first = (Object.keys(next) as Field[])[0];
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    const subject = `${form.topic}${form.reference ? ` · ${form.reference.trim()}` : ""}`;
    const body = `${form.message.trim()}\n\n${form.name.trim()}\n${form.email.trim()}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
    requestAnimationFrame(() => status.current?.focus());
  };

  const input = (k: Field, invalid: boolean) =>
    clsx(
      "mt-2 block w-full border bg-transparent px-4 text-[15px] text-ivory outline-none transition-colors duration-quick focus:border-ivory",
      invalid ? "border-[#E39A9D]" : "border-line",
      k === "message" ? "min-h-40 py-3" : "min-h-12",
    );
  const error = (k: Field) =>
    errors[k] && (
      <p id={`${id}-${k}-error`} className="mt-2 text-sm text-[#E39A9D]">
        {errors[k]}
      </p>
    );
  const described = (k: Field) => (errors[k] ? `${id}-${k}-error` : undefined);

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="label text-mist">Name</label>
          <input id={`${id}-name`} value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" required aria-invalid={!!errors.name} aria-describedby={described("name")} className={input("name", !!errors.name)} />
          {error("name")}
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="label text-mist">Email</label>
          <input id={`${id}-email`} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" required aria-invalid={!!errors.email} aria-describedby={described("email")} className={input("email", !!errors.email)} />
          {error("email")}
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-topic`} className="label text-mist">Topic</label>
          <select id={`${id}-topic`} value={form.topic} onChange={(e) => set("topic", e.target.value)} className="mt-2 block min-h-12 w-full border border-line bg-ink px-4 text-[15px] text-ivory outline-none focus:border-ivory">
            {TOPICS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-reference`} className="label text-mist">Order reference <span className="normal-case tracking-normal text-smoke">(optional)</span></label>
          <input id={`${id}-reference`} value={form.reference} onChange={(e) => set("reference", e.target.value)} placeholder="VSP-…" className={input("name", false)} />
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-message`} className="label text-mist">Message</label>
        <textarea id={`${id}-message`} value={form.message} onChange={(e) => set("message", e.target.value)} required aria-invalid={!!errors.message} aria-describedby={described("message")} className={input("message", !!errors.message)} />
        {error("message")}
      </div>
      <div className="flex flex-wrap items-center gap-6 pt-2">
        <button type="submit" className="label inline-flex min-h-14 items-center justify-center bg-ivory px-10 font-semibold text-ink transition-colors duration-quick hover:bg-white">
          Write to us
        </button>
        <p className="text-sm text-smoke">Opens your email app with the message ready to send.</p>
      </div>
      <p ref={status} tabIndex={-1} role="status" className={clsx("text-[15px] text-mist outline-none", !sent && "sr-only")}>
        {sent && (
          <>
            Your email app should now be open with the message. If nothing happened, write to{" "}
            <a href={`mailto:${site.email}`} className="link-draw text-ivory">{site.email}</a>.
          </>
        )}
      </p>
    </form>
  );
}
