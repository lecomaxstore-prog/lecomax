/** Extract only identifiers and status from an already signature-verified event. */
export function paypalWebhookChange(event: unknown) {
  if (!event || typeof event !== "object") return null;
  const value = event as Record<string, any>;
  const identifier = (v: unknown) => typeof v === "string" && /^[A-Za-z0-9_.:-]{1,100}$/.test(v) ? v : null;
  const eventId = identifier(value.id);
  const eventType = identifier(value.event_type);
  if (!eventId || !eventType) return null;
  const statuses: Record<string, string> = {
    "PAYMENT.CAPTURE.COMPLETED": "captured", "PAYMENT.CAPTURE.PENDING": "pending",
    "PAYMENT.CAPTURE.DECLINED": "failed", "PAYMENT.CAPTURE.DENIED": "failed",
    "PAYMENT.CAPTURE.REFUNDED": "refunded", "PAYMENT.CAPTURE.REVERSED": "reversed",
  };
  const status = statuses[eventType] ?? null;
  let captureId = identifier(value.resource?.id);
  if (eventType === "PAYMENT.CAPTURE.REFUNDED") {
    // A refund's resource.id identifies the refund, not the original capture.
    captureId = identifier(value.resource?.supplementary_data?.related_ids?.capture_id);
    if (!captureId && Array.isArray(value.resource?.links)) {
      for (const link of value.resource.links) {
        if (link?.rel !== "up" || typeof link.href !== "string") continue;
        try {
          const url = new URL(link.href);
          if (url.protocol !== "https:" || !["api.paypal.com", "api.sandbox.paypal.com", "api-m.paypal.com", "api-m.sandbox.paypal.com"].includes(url.hostname) || url.username || url.password || url.port) continue;
          captureId = identifier(/^\/v2\/payments\/captures\/([A-Za-z0-9]+)$/.exec(url.pathname)?.[1]);
        } catch { /* Malformed links cannot identify a capture. */ }
      }
    }
  }
  const createdAt = typeof value.create_time === "string" ? Date.parse(value.create_time) : NaN;
  if (status && (!captureId || !Number.isFinite(createdAt))) return null;
  return { eventId, eventType, captureId, status, createdAt: Number.isFinite(createdAt) ? new Date(createdAt).toISOString() : null };
}
