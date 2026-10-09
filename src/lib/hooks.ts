import { useEffect, useRef, type DependencyList } from "react";

// Runs `fn` immediately and then every `intervalMs` after the previous run
// finishes. In-flight requests are aborted when deps change or on unmount.
export function usePolling(
  fn: (signal: AbortSignal) => Promise<void>,
  intervalMs: number,
  deps: DependencyList,
  enabled = true
) {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let controller = new AbortController();
    const tick = async () => {
      controller = new AbortController();
      try {
        await fnRef.current(controller.signal);
      } catch (e) {
        if (!controller.signal.aborted) console.error(e);
      }
      if (!stopped) timer = setTimeout(tick, intervalMs);
    };
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs, ...deps]);
}
