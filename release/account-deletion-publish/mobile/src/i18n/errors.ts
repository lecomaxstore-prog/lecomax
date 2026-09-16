import fr from "./locales/fr.json";
import en from "./locales/en.json";
import { msg, type TranslationKey } from "./index";

// Translate known service messages again at display time: cached errors can
// outlive a language change. Unknown server/SDK prose uses a localized fallback.
const messageKeys = new Map<string, TranslationKey>();
const templates: { pattern: RegExp; names: string[]; key: TranslationKey }[] = [];
for (const catalog of [fr, en]) {
  for (const [key, value] of Object.entries(catalog)) {
    if (!value.includes("{{")) messageKeys.set(value, key as TranslationKey);
    else {
      const names: string[] = [];
      const pattern = value.split(/(\{\{\w+\}\})/).map(part => {
        if (part.startsWith("{{")) { names.push(part.slice(2, -2)); return "(.+?)"; }
        return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }).join("");
      templates.push({ pattern: new RegExp(`^${pattern}$`), names, key: key as TranslationKey });
    }
  }
}
const authKeys: Record<string, TranslationKey> = {
  invalid_credentials: "auth.incorrectEmailAddressOrPassword",
  email_not_confirmed: "auth.emailNotConfirmed",
  user_already_exists: "auth.emailAlreadyRegistered",
  email_exists: "auth.emailAlreadyRegistered",
  weak_password: "auth.yourPasswordMustContainAtLeast8Characters",
  over_request_rate_limit: "errors.rateLimit",
  over_email_send_rate_limit: "errors.rateLimit",
};

export function localizedError(error: unknown, fallback: TranslationKey = "errors.tryAgain"): string {
  const value = typeof error === "string" ? error : error && typeof error === "object" && "message" in error ? String(error.message) : "";
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (authKeys[code]) return msg(authKeys[code]);
  if (value === "Invalid login credentials") return msg("auth.incorrectEmailAddressOrPassword");
  const key = messageKeys.get(value.trim());
  if (key) return msg(key);
  for (const template of templates) {
    const match = template.pattern.exec(value);
    if (match) return msg(template.key, Object.fromEntries(template.names.map((name, index) => [name, name === "count" ? Number(match[index + 1]) : match[index + 1]])));
  }
  return msg(fallback);
}
