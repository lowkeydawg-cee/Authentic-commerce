"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getInventory, type AdminSession, type InventoryRepository } from "@/lib/inventory";
import { refreshInventory, useInventoryState } from "@/lib/inventory/live";
import { Kpis } from "./Kpis";
import { OrdersFeed } from "./OrdersFeed";
import { SettingsPanel } from "./SettingsPanel";
import { SignIn } from "./SignIn";
import { StockGrid } from "./StockGrid";

/**
 * Stock admin. Every number here is live: an order on the storefront, a
 * change in another admin tab or on another device updates it in place.
 */
export function AdminApp() {
  const [repo, setRepo] = useState<InventoryRepository | null>(null);
  const [session, setSession] = useState<AdminSession | null | undefined>(undefined);
  const [fatal, setFatal] = useState<string | null>(null);
  const { snapshot, error } = useInventoryState();

  useEffect(() => {
    let off = () => {};
    getInventory()
      .then(async (r) => {
        setRepo(r);
        setSession(await r.getSession());
        off = r.onAuthChange((s) => {
          setSession(s);
          // Orders are admin-only on Supabase, so reload once signed in or out.
          void refreshInventory();
        });
      })
      .catch((e) => setFatal(e instanceof Error ? e.message : String(e)));
    return () => off();
  }, []);

  const signedIn = !!session;

  return (
    <div className="min-h-svh">
      <header className="border-b border-line">
        <div className="page-x mx-auto flex min-h-16 max-w-page flex-wrap items-center justify-between gap-x-8 gap-y-2 py-3">
          <div className="flex items-baseline gap-4">
            <Link href="/" className="font-display text-xl tracking-wordmark">
              VESPER
            </Link>
            <span className="label text-smoke">Stock admin</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            {repo && <BackendChip kind={repo.kind} />}
            {repo?.requiresAuth && session && (
              <>
                <span className="text-sm text-mist">{session.email}</span>
                <button type="button" onClick={() => repo.signOut()} className="label link-draw tap text-mist hover:text-ivory">
                  Sign out
                </button>
              </>
            )}
            <Link href="/" className="label link-draw tap text-mist hover:text-ivory">
              View store
            </Link>
          </div>
        </div>
      </header>

      <div className="page-x mx-auto max-w-page py-10 lg:py-14">
        {fatal || (error && !snapshot) ? (
          <Problem message={fatal ?? error!} />
        ) : !repo || session === undefined ? (
          <p className="label text-smoke" role="status">
            Loading stock…
          </p>
        ) : repo.requiresAuth && !signedIn ? (
          <SignIn repo={repo} />
        ) : !snapshot ? (
          <p className="label text-smoke" role="status">
            Loading stock…
          </p>
        ) : (
          <>
            <h1 className="font-display text-[clamp(40px,5vw,72px)] leading-none">Stock</h1>
            <p className="mt-4 max-w-2xl text-[15px] font-light leading-relaxed text-mist">
              Every size of every colour. Changes here show in the store immediately, and every order reduces stock the moment it is placed.
            </p>
            <Kpis snapshot={snapshot} />
            <div className="mt-14 grid gap-14 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-x-10 xl:items-start">
              <StockGrid repo={repo} snapshot={snapshot} />
              <aside className="space-y-12 xl:sticky xl:top-8">
                <OrdersFeed orders={snapshot.orders} hidden={repo.kind === "supabase" && !signedIn} />
                <SettingsPanel repo={repo} snapshot={snapshot} />
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BackendChip({ kind }: { kind: "local" | "supabase" }) {
  return (
    <span className="flex items-center gap-2 text-sm text-mist" title={kind === "local" ? "Stock is stored in this browser and synced between its tabs." : "Stock is stored in Supabase and synced to every device."}>
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#8FB89A]" />
      {kind === "local" ? "Live · this browser (demo)" : "Live · Supabase"}
    </span>
  );
}

function Problem({ message }: { message: string }) {
  return (
    <div role="alert" className="max-w-2xl border border-[#E39A9D]/70 bg-night p-6">
      <p className="font-display text-2xl">The stock service isn&apos;t reachable.</p>
      <p className="mt-3 text-sm leading-relaxed text-mist">{message}</p>
      <p className="mt-3 text-sm leading-relaxed text-mist">Check the Supabase settings in the deployment&apos;s environment variables (see the README).</p>
    </div>
  );
}
