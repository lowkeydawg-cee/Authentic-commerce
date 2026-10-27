/**
 * Milestone 9: run non-urgent work (starting 3D) only after the page has
 * loaded and the main thread is idle, so it never competes with first paint
 * or the first interaction. Returns a cancel function.
 */
export function whenIdle(task: () => void, timeout = 2500): () => void {
  let idleId: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancelled = false;

  const schedule = () => {
    if (cancelled) return;
    if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(() => !cancelled && task(), { timeout });
    else timer = setTimeout(() => !cancelled && task(), 200);
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener("load", schedule);
    if (idleId !== undefined && "cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
    if (timer) clearTimeout(timer);
  };
}
