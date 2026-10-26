"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Database, Layers, LayoutDashboard, LogOut, Receipt, Settings, Store, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { useEffect, useState } from "react";
import type { AdminSession } from "@/lib/data";
import { useInventory } from "@/store/inventory";
import { CategoryManager } from "./CategoryManager";
import { InventoryTable } from "./InventoryTable";
import { LoginCard } from "./LoginCard";
import { OrdersPanel } from "./OrdersPanel";
import { SettingsPanel } from "./SettingsPanel";
import { StatsCards } from "./StatsCards";

type Tab = "inventory" | "orders" | "storefront";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "inventory", label: "Inventory", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: Receipt },
  { id: "storefront", label: "Storefront", icon: Layers },
];

export function AdminApp() {
  const { repo, settings, ready, error } = useInventory();
  const [session, setSession] = useState<AdminSession | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("inventory");

  useEffect(() => {
    void repo.getSession().then(setSession);
    return repo.onAuthChange(setSession);
  }, [repo]);

  if (session === undefined || !ready) {
    return (
      <div className="grid min-h-screen place-items-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }} className="h-10 w-10 rounded-full border-2 border-white/10 border-t-gold-300" />
      </div>
    );
  }
  if (repo.requiresAuth && !session) return <LoginCard />;

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-gold-200 to-gold-500 font-display font-bold text-ink-950">
              {settings.storeName.charAt(0)}
            </span>
            <div className="leading-tight">
              <p className="font-display text-lg">{settings.storeName} Admin</p>
              <p className="flex items-center gap-1.5 text-[11px] text-white/45">
                <Database className="h-3 w-3" /> {repo.kind === "supabase" ? "Supabase · PostgreSQL" : "Local demo store"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs sm:flex",
                error ? "bg-rose-500/10 text-rose-300" : "bg-emerald-400/10 text-emerald-300",
              )}
            >
              {error ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
              {error ? "Sync error" : "Live sync"}
              {!error && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
              )}
            </span>
            <Link href="/" className="flex h-9 items-center gap-2 rounded-full px-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white">
              <Store className="h-4 w-4" /> <span className="hidden sm:inline">Storefront</span>
            </Link>
            {repo.requiresAuth && (
              <button onClick={() => repo.signOut()} className="flex h-9 items-center gap-2 rounded-full px-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white" title={session?.email}>
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container-page mt-8 space-y-8">
        {error && <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p>}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-4xl">Stock control</h1>
            <p className="mt-1 text-sm text-white/50">Every storefront purchase updates these numbers instantly.</p>
          </div>
          <LayoutGroup>
            <nav className="glass flex rounded-full p-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={clsx("relative flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors", tab === t.id ? "text-ink-950" : "text-white/60 hover:text-white")}
                >
                  {tab === t.id && (
                    <motion.span layoutId="admin-tab" className="absolute inset-0 rounded-full bg-gradient-to-r from-gold-200 to-gold-400" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                  )}
                  <t.icon className="relative h-4 w-4" />
                  <span className="relative">{t.label}</span>
                </button>
              ))}
            </nav>
          </LayoutGroup>
        </div>

        <StatsCards />

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {tab === "inventory" && (
              <div className="grid gap-6 2xl:grid-cols-[1fr_360px]">
                <InventoryTable />
                <div className="hidden 2xl:block">
                  <OrdersPanel limit={8} />
                </div>
              </div>
            )}
            {tab === "orders" && <OrdersPanel />}
            {tab === "storefront" && (
              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <SettingsPanel />
                <CategoryManager />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <p className="flex items-center justify-center gap-2 text-xs text-white/30">
          <Settings className="h-3.5 w-3.5" />
          Tip: open the storefront in another tab, buy something, and watch the quantities update here live.
        </p>
      </main>
    </div>
  );
}
