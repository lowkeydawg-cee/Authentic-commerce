"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { useToasts, type ToastTone } from "@/store/toast";

const ICONS: Record<ToastTone, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-300" />,
  error: <XCircle className="h-5 w-5 text-rose-300" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-300" />,
  info: <Info className="h-5 w-5 text-sky-300" />,
};

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-[min(92vw,380px)] -translate-x-1/2 flex-col gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            onClick={() => dismiss(t.id)}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="glass-strong pointer-events-auto flex items-start gap-3 rounded-2xl p-4 text-left"
          >
            {ICONS[t.tone]}
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-white/60">{t.description}</p>}
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
