"use client";

import { useInventory } from "@/store/inventory";

export function Footer() {
  const { settings } = useInventory();
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="container-page flex flex-col items-center justify-between gap-4 text-sm text-white/40 sm:flex-row">
        <p>© {new Date().getFullYear()} {settings.storeName}. Crafted in Kigali, Rwanda.</p>
        <p>Prices in {settings.currency} · Live stock availability</p>
      </div>
    </footer>
  );
}
