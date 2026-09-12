import { useEffect, useMemo, useRef } from "react";

export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
): (...args: Args) => void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingArgsRef = useRef<Args | null>(null);

  useEffect(() => {
    return () => {
      // Flush instead of discarding: a pending save must not be lost just
      // because the component unmounts (e.g. the user navigates away within
      // the debounce window right after typing).
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        if (pendingArgsRef.current) {
          callbackRef.current(...pendingArgsRef.current);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useMemo(() => {
    return (...args: Args) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      pendingArgsRef.current = args;
      timeoutRef.current = setTimeout(() => {
        pendingArgsRef.current = null;
        callbackRef.current(...args);
      }, delayMs);
    };
  }, [delayMs]);
}
