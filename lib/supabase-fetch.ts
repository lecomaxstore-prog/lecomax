/** Retry safe background reads and session refreshes after a transient transport failure. */
export function createSupabaseFetch(fetcher: typeof fetch): typeof fetch {
  return async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const safeToRetry = method === "GET" || (method === "POST" && url.pathname.endsWith("/auth/v1/token") && url.searchParams.get("grant_type") === "refresh_token");
    try {
      return await fetcher(input, init);
    } catch (error) {
      const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
      if (!safeToRetry || signal?.aborted || !(error instanceof TypeError) || input instanceof Request) throw error;
      // Yield once before retrying, retaining the original credentials and abort signal.
      await new Promise(resolve => setTimeout(resolve, 400));
      if (signal?.aborted) throw signal.reason;
      return fetcher(input, init);
    }
  };
}
