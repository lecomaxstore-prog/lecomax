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
