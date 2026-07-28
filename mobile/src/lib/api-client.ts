import { runtimeConfig } from "@/lib/runtime-config";
import { supabase } from "@/lib/supabase";
import type { ZodType } from "zod";

const DEFAULT_TIMEOUT_MS = 12_000;
const SAFE_RETRY_STATUSES = new Set([408, 429, 502, 503, 504]);

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiRequestOptions = RequestInit & {
  authenticated?: boolean;
  timeoutMs?: number;
  retries?: number;
};

type ErrorPayload = { error?: unknown; code?: unknown; details?: unknown };

function endpoint(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${runtimeConfig.apiUrl}${normalizedPath}`;
}

function normalizedMessage(payload: ErrorPayload | null | undefined, status: number) {
  if (typeof payload?.error === "string" && payload.error.trim()) return payload.error.trim();
  if (status === 401) return "Votre session a expiré. Reconnectez-vous.";
  if (status === 403) return "Cette action n’est pas autorisée.";
  if (status === 404) return "La ressource demandée est introuvable.";
  if (status === 409) return "Les informations ont changé. Actualisez puis réessayez.";
  if (status >= 500) return "Le service L’ECOMAX est momentanément indisponible.";
  return `Erreur L’ECOMAX (${status}).`;
}

async function accessToken(required: boolean) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new ApiError("Impossible de vérifier votre session.", 401, "SESSION_READ_FAILED");
  let session = data.session;
  if (session?.expires_at && session.expires_at * 1000 - Date.now() < 60_000) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error) {
      if (required) throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401, "SESSION_EXPIRED");
      return undefined;
    }
    session = refreshed.data.session;
  }
  if (required && !session?.access_token) {
    throw new ApiError("Connectez-vous pour continuer.", 401, "AUTH_REQUIRED");
  }
  return session?.access_token;
}

function wait(milliseconds: number, signal?: AbortSignal | null) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => signal?.removeEventListener("abort", abort);
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, milliseconds);
    const abort = () => {
      clearTimeout(timer);
      cleanup();
      reject(new ApiError("Requête annulée.", 0, "REQUEST_ABORTED"));
    };
    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort, { once: true });
  });
}

function retryDelay(response: Response, attempt: number) {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.min(10_000, Math.max(0, seconds * 1_000));
    const date = Date.parse(retryAfter);
    if (Number.isFinite(date)) return Math.min(10_000, Math.max(0, date - Date.now()));
  }
  return Math.min(2_000, 250 * 2 ** Math.max(0, attempt - 1));
}

async function responsePayload(response: Response) {
  if (response.status === 204 || response.status === 205) return undefined;
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("application/json") || contentType.includes("+json")) {
    return response.json().catch(() => null);
  }
  const text = await response.text().catch(() => "");
  return text ? { error: text.slice(0, 500) } : null;
}

export async function apiRequest<T>(pathname: string, options: ApiRequestOptions = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const safeRequest = method === "GET" || method === "HEAD";
  const maxRetries = safeRequest ? Math.max(0, options.retries ?? 2) : 0;
  const token = await accessToken(options.authenticated === true);
  let attempt = 0;

  while (true) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const abortFromCaller = () => controller.abort();
    options.signal?.addEventListener("abort", abortFromCaller, { once: true });
    try {
      const hasBody = options.body !== undefined;
      const headers = new Headers(options.headers);
      headers.set("Accept", "application/json");
      if (hasBody && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const { authenticated: _authenticated, timeoutMs: _timeoutMs, retries: _retries, ...requestOptions } = options;
      const response = await fetch(endpoint(pathname), {
        ...requestOptions,
        signal: controller.signal,
        headers,
      });
      const payload = await responsePayload(response) as (T & ErrorPayload) | null | undefined;
      if (!response.ok) {
        const error = new ApiError(
          normalizedMessage(payload, response.status),
          response.status,
          typeof payload?.code === "string" ? payload.code : undefined,
          payload?.details,
        );
        if (attempt < maxRetries && SAFE_RETRY_STATUSES.has(response.status)) {
          attempt += 1;
          await wait(retryDelay(response, attempt), options.signal);
          continue;
        }
        throw error;
      }
      if (payload === null) throw new ApiError("Réponse API L’ECOMAX invalide.", response.status, "INVALID_RESPONSE");
      if (response.status === 204 || response.status === 205) return undefined as T;
      return payload as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (options.signal?.aborted) throw new ApiError("Requête annulée.", 0, "REQUEST_ABORTED");
      const timedOut = controller.signal.aborted;
      if (attempt < maxRetries) {
        attempt += 1;
        await wait(250 * 2 ** (attempt - 1), options.signal);
        continue;
      }
      throw new ApiError(
        timedOut ? "Le serveur L’ECOMAX met trop de temps à répondre." : "Connexion au serveur impossible. Vérifiez votre réseau.",
        0,
        timedOut ? "REQUEST_TIMEOUT" : "NETWORK_ERROR",
      );
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", abortFromCaller);
    }
  }
}

export async function apiRequestValidated<T>(
  pathname: string,
  schema: ZodType<T>,
  options: ApiRequestOptions = {},
): Promise<T> {
  const payload = await apiRequest<unknown>(pathname, options);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(
      "Les données reçues de L’ECOMAX sont invalides. Actualisez puis réessayez.",
      502,
      "INVALID_API_SCHEMA",
      parsed.error.flatten(),
    );
  }
  return parsed.data;
}
