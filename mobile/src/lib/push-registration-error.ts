import { msg } from "@/i18n";
import { ApiError } from "@/lib/api-client";

export function pushRegistrationErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  const message = error instanceof Error ? error.message : "";
  if (/FirebaseApp|google-services|default Firebase|projectId|EAS project|PUSH_NOT_CONFIGURED/i.test(message)) {
    return msg("notificationOptIn.configurationError");
  }
  if (/SERVICE_NOT_AVAILABLE|NETWORK|offline|timed?\s*out|fetch failed/i.test(message)) {
    return msg("notificationOptIn.connectionError");
  }
  return msg("notificationOptIn.error");
}
