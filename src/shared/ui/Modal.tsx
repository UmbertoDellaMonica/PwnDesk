import type { ReactNode } from "react";

type ModalSize = "md" | "lg" | "xl";

const sizeClasses: Record<ModalSize, string> = {
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
}

export function Modal({ open, title, onClose, children, size = "md" }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={`bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto p-5 ${sizeClasses[size]}`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-neutral-100 mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}
