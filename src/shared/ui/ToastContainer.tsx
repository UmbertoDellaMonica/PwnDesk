import { useToastStore } from "./toastStore";

/** Mounted once in AppShell — every action across the app reports through the same corner instead of some mutations giving feedback and others silently succeeding. */
export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-lg ${
            toast.tone === "error"
              ? "border-red-800 bg-red-950/90 text-red-200"
              : "border-emerald-800 bg-emerald-950/90 text-emerald-200"
          }`}
        >
          <span>{toast.message}</span>
          <button
            className="ml-1 text-xs opacity-60 hover:opacity-100"
            onClick={() => dismiss(toast.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
