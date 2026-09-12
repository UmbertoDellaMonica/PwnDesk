import { create } from "zustand";
import { newId } from "../lib/id";

export interface Toast {
  id: string;
  message: string;
  tone: "success" | "error";
}

interface ToastState {
  toasts: Toast[];
  show: (message: string, tone?: Toast["tone"]) => void;
  dismiss: (id: string) => void;
}

const AUTO_DISMISS_MS = 3000;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message, tone = "success") => {
    const id = newId();
    set((state) => ({ toasts: [...state.toasts, { id, message, tone }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
    }, AUTO_DISMISS_MS);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

export function showToast(message: string, tone: Toast["tone"] = "success"): void {
  useToastStore.getState().show(message, tone);
}
