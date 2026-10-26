"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useInventory } from "@/store/inventory";

export function LoginCard() {
  const { repo, settings } = useInventory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await repo.signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1, x: error ? [0, -8, 8, -5, 5, 0] : 0 }}
        className="glass-strong w-full max-w-sm rounded-3xl p-8"
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-300/10 text-gold-300">
          <Lock className="h-5 w-5" />
        </span>
        <h1 className="mt-6 font-display text-3xl">{settings.storeName} Admin</h1>
        <p className="mt-1 text-sm text-white/50">Sign in with your store administrator account.</p>
        <div className="mt-8 space-y-4">
          <Field label="Email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Field label="Password" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        <Button type="submit" className="mt-8 w-full" loading={loading}>
          Sign in
        </Button>
      </motion.form>
    </div>
  );
}
