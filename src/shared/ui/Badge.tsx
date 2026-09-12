import type { ReactNode } from "react";

const severityClasses: Record<string, string> = {
  critical: "bg-red-900/60 text-red-300",
  high: "bg-orange-900/60 text-orange-300",
  medium: "bg-yellow-900/60 text-yellow-300",
  low: "bg-blue-900/60 text-blue-300",
  none: "bg-neutral-800 text-neutral-400",
};

const statusClasses: Record<string, string> = {
  draft: "bg-neutral-800 text-neutral-400",
  validated: "bg-blue-900/60 text-blue-300",
  reported: "bg-purple-900/60 text-purple-300",
  remediated: "bg-emerald-900/60 text-emerald-300",
  retested: "bg-teal-900/60 text-teal-300",
  closed: "bg-neutral-800 text-neutral-500 line-through",
};

export function SeverityBadge({ severity }: { severity: string | null }) {
  const key = severity ?? "none";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityClasses[key] ?? severityClasses.none}`}>
      {key}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses[status] ?? statusClasses.draft}`}>
      {status}
    </span>
  );
}

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium bg-neutral-800 text-neutral-300 ${className}`}>
      {children}
    </span>
  );
}
