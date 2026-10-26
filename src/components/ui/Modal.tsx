"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import clsx from "clsx";
import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Prevent closing via backdrop/Escape (e.g. while a payment is processing). */
  locked?: boolean;
}

export function Modal({ open, onClose, title, children, className, locked }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !locked && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, locked, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-md"
            onClick={() => !locked && onClose()}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={clsx(
              "glass-strong relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl p-6 sm:max-w-xl sm:rounded-3xl sm:p-8",
              className,
            )}
            initial={{ y: 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            {(title || !locked) && (
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="font-display text-2xl text-white">{title}</div>
                {!locked && (
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 text-white/60 transition hover:rotate-90 hover:bg-white/10 hover:text-white"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
