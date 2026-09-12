interface ResizeHandleProps {
  /** Reads the live current value at drag-start — must not be a value closed over from render, or the drag base goes stale mid-gesture. */
  getValue: () => number;
  onChange: (value: number) => void;
  /** Fired once on drag end — use this to persist, rather than persisting on every onChange call during the drag. */
  onCommit?: () => void;
}

/**
 * A thin VS Code-style drag handle between panels. Computes the new size as
 * `startValue + (currentX - startX)` for the whole gesture — a fixed
 * reference point captured once at pointerdown — rather than accumulating
 * per-event deltas on top of a value read from React props/state. The
 * latter goes stale mid-drag (the prop closure is fixed to the render that
 * was current when the pointerdown handler was attached, not to the state
 * as it changes over the following events), which is what made the old
 * implementation feel jerky instead of tracking the pointer 1:1.
 */
export function ResizeHandle({ getValue, onChange, onCommit }: ResizeHandleProps) {
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);

    const startX = event.clientX;
    const startValue = getValue();
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMove = (moveEvent: PointerEvent) => {
      onChange(startValue + (moveEvent.clientX - startX));
    };
    const handleUp = () => {
      target.releasePointerCapture(event.pointerId);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      onCommit?.();
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      className="group relative w-1 shrink-0 cursor-col-resize touch-none select-none"
    >
      <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-emerald-600/40 group-active:bg-emerald-600/70" />
      <div className="h-full w-px bg-neutral-800" />
    </div>
  );
}
