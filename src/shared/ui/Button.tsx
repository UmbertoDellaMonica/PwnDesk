import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary: "bg-emerald-600 hover:bg-emerald-500 text-white",
  secondary: "bg-neutral-700 hover:bg-neutral-600 text-neutral-100",
  danger: "bg-red-700 hover:bg-red-600 text-white",
  ghost: "bg-transparent hover:bg-neutral-800 text-neutral-300",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
