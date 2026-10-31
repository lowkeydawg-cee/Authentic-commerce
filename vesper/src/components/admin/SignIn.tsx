"use client";

import { useId, useState } from "react";
import type { InventoryRepository } from "@/lib/inventory";

export function SignIn({ repo }: { repo: InventoryRepository }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await repo.signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };
  const field = "mt-2 block min-h-12 w-full border border-line bg-transparent px-4 text-[15px] text-ivory outline-none transition-colors duration-quick focus:border-ivory";

  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-6 border border-line p-8">
      <h1 className="font-display text-4xl">Sign in</h1>
      <p className="text-sm leading-relaxed text-mist">Only store admins can change stock and see orders.</p>
      <div>
        <label htmlFor={`${id}-email`} className="label text-mist">Email</label>
        <input id={`${id}-email`} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
      </div>
      <div>
        <label htmlFor={`${id}-password`} className="label text-mist">Password</label>
        <input id={`${id}-password`} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
      </div>
      <p role="alert" className="min-h-5 text-sm text-[#E39A9D]">{error}</p>
      <button type="submit" disabled={busy} className="label inline-flex min-h-14 w-full items-center justify-center bg-ivory font-semibold text-ink transition-colors duration-quick hover:bg-white disabled:opacity-60">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
