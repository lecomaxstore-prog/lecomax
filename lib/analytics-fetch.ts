/** Bound both the response and JSON read, and cancel obsolete period requests. */
export async function fetchAnalytics<T>(days: number, options: { previous?: boolean; signal?: AbortSignal } = {}): Promise<T> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  const timeout = setTimeout(cancel, 10_000);
  options.signal?.addEventListener("abort", cancel, { once: true });
  if (options.signal?.aborted) cancel();
  try {
    const response = await fetch(`/api/analytics?days=${days}${options.previous ? "&summary=previous" : ""}`, {
      cache: "no-store", signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Analytics request failed (${response.status})`);
    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", cancel);
  }
}
