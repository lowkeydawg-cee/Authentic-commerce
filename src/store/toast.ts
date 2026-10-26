"use client";

import { create } from "zustand";

export type ToastTone = "success" | "error" | "info" | "warning";

export interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

let counter = 0;

export const useToasts = create<ToastState>()((set, get) => ({
  toasts: [],
  push(toast) {
    // Collapse identical toasts fired in quick succession.
    if (get().toasts.some((t) => t.title === toast.title && t.description === toast.description)) return;
    const id = ++counter;
    set({ toasts: [...get().toasts, { ...toast, id }].slice(-4) });
    setTimeout(() => get().dismiss(id), 3800);
  },
  dismiss(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));

export const toast = (t: Omit<Toast, "id">) => useToasts.getState().push(t);
