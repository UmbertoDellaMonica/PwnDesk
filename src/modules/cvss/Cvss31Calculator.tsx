import { useState } from "react";
import { SeverityBadge } from "../../shared/ui/Badge";
import { Button } from "../../shared/ui/Button";
import {
  CVSS_METRICS,
  computeCvss31,
  isSelectionComplete,
  parseCvss31Vector,
  type Cvss31Selection,
} from "./cvss31";

interface Cvss31CalculatorProps {
  initialVector?: string | null;
  onSave: (result: ReturnType<typeof computeCvss31>) => void;
  onCancel: () => void;
}

export function Cvss31Calculator({ initialVector, onSave, onCancel }: Cvss31CalculatorProps) {
  const [selection, setSelection] = useState<Partial<Cvss31Selection>>(() =>
    parseCvss31Vector(initialVector),
  );

  const complete = isSelectionComplete(selection);
  const result = complete ? computeCvss31(selection) : null;

  return (
    <div className="space-y-4">
      {CVSS_METRICS.map((metric) => (
        <div key={metric.id}>
          <p className="mb-1.5 text-xs font-medium text-neutral-400">{metric.name}</p>
          <div className="flex flex-wrap gap-1.5">
            {metric.options.map((option) => {
              const active = selection[metric.id] === option.code;
              return (
                <button
                  key={option.code}
                  type="button"
                  title={option.description}
                  onClick={() => setSelection((prev) => ({ ...prev, [metric.id]: option.code }))}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    active
                      ? "border-emerald-600 bg-emerald-900/40 text-emerald-300"
                      : "border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  <span>{option.icon}</span>
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2.5">
        {result ? (
          <div className="flex items-center gap-3">
            <SeverityBadge severity={result.severity} />
            <span className="text-sm font-semibold text-neutral-100">{result.score.toFixed(1)}</span>
            <span className="font-mono text-xs text-neutral-500">{result.vector}</span>
          </div>
        ) : (
          <span className="text-xs text-neutral-500">
            Pick all {CVSS_METRICS.length} metrics to see the score.
          </span>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={!result} onClick={() => result && onSave(result)}>
          Save
        </Button>
      </div>
    </div>
  );
}
