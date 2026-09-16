"use client";

import { supabase } from "@/lib/supabase";

export const CUSTOMER_SESSION_KEY = "lecomax_customer_session_seen";
export const CUSTOMER_SESSION_EXPIRED_EVENT = "lecomax:session-expired";

export class CustomerSessionExpiredError extends Error {
  constructor() {
    super("Customer session expired");
    this.name = "CustomerSessionExpiredError";
  }
}

export function announceSessionExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CUSTOMER_SESSION_EXPIRED_EVENT));
  }
}

export async function customerApiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    announceSessionExpired();
    throw new CustomerSessionExpiredError();
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);
  const response = await fetch(input, { ...init, headers });
  if (response.status === 401) announceSessionExpired();
  return response;
}
