"use client";

import { MotionConfig } from "framer-motion";
import { InventoryProvider } from "@/store/inventory";
import { Toaster } from "@/components/ui/Toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <InventoryProvider>
        {children}
        <Toaster />
      </InventoryProvider>
    </MotionConfig>
  );
}
