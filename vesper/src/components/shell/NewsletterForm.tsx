"use client";

import { useId, useState } from "react";

/**
 * Newsletter sign-up. Validation and states are real; the submission is not yet
 * wired to an email provider (planned with the commerce/CMS integration).
 */
export function NewsletterForm() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "invalid" | "done">("idle");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(/^\S+@\S+\.\S+$/.test(email) ? "done" : "invalid");
  };

  return (
    <form onSubmit={submit} noValidate className="mt-8">
      <label htmlFor={`${id}-email`} className="label text-smoke">
        Email address
      </label>
      <div className="mt-3 flex border-b border-mist/50 focus-within:border-ivory">
        <input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setStatus("idle");
          }}
          aria-invalid={status === "invalid"}
          aria-describedby={`${id}-status`}
          className="min-h-12 flex-1 bg-transparent text-[15px] text-ivory outline-none placeholder:text-smoke"
          placeholder="you@example.com"
        />
        <button type="submit" className="label min-h-12 px-2 text-ivory">
          Subscribe
        </button>
      </div>
      <p id={`${id}-status`} role="status" className="mt-3 min-h-5 text-sm">
        {status === "invalid" && <span className="text-[#E39A9D]">Please enter a valid email address.</span>}
        {status === "done" && <span className="text-mist">Thank you — your first letter arrives with the next chapter.</span>}
      </p>
    </form>
  );
}
