/**
 * Runs `callback` once the page has loaded and the main thread is idle, so
 * deferred work never competes with first paint or hydration. Returns a
 * function that cancels it.
 */
export function afterPageIdle(callback: () => void): () => void {
  let cancelled = false;
  let handle = 0;
  const supportsIdle = typeof window.requestIdleCallback === "function";

  const schedule = () => {
    if (cancelled) return;
    handle = supportsIdle
      ? window.requestIdleCallback(callback, { timeout: 1500 })
      : window.setTimeout(callback, 200);
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener("load", schedule);
    if (supportsIdle) window.cancelIdleCallback(handle);
    else window.clearTimeout(handle);
  };
}
