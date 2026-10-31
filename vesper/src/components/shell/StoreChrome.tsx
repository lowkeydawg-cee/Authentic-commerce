"use client";

import { usePathname } from "next/navigation";

/** Storefront chrome (header, footer, bag) is hidden on the admin, which has its own. */
export function StoreChrome({ children }: { children: React.ReactNode }) {
  return usePathname().startsWith("/admin") ? null : children;
}
