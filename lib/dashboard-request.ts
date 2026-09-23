function waitForRetry(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) { reject(signal.reason); return; }
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, milliseconds);
    signal.addEventListener("abort", abort, { once: true });
  });
}

/** Retry temporary failures only; authentication and permission errors need user action. */
export async function requestDashboard(
  url: string,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
  wait: (milliseconds: number, signal: AbortSignal) => Promise<void> = waitForRetry,
  timeoutMs = 20_000,
) {
  const controller = new AbortController();
  const cancel = () => controller.abort(signal.reason);
  signal.addEventListener("abort", cancel, { once: true });
  if (signal.aborted) cancel();
  const timer = setTimeout(() => controller.abort(new DOMException(
    "Le serveur met trop de temps à répondre. Réessayez dans quelques instants.", "TimeoutError",
  )), timeoutMs);
  try {
    return await requestWithRetry(url, controller.signal, fetcher, wait);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", cancel);
  }
}

async function requestWithRetry(
  url: string,
  signal: AbortSignal,
  fetcher: typeof fetch,
  wait: (milliseconds: number, signal: AbortSignal) => Promise<void>,
) {
  for (let attempt = 0; attempt < 3; attempt++) {
    signal.throwIfAborted();
    try {
      const response = await fetcher(url, { cache: "no-store", signal });
      if (response.status < 500 || attempt === 2) return response;
    } catch (error) {
      if (signal.aborted || attempt === 2) throw error;
    }
    await wait(1000 * (attempt + 1), signal);
  }
  throw new Error("Dashboard unavailable");
}
