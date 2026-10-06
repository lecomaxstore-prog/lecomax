import "server-only";
import { containsEmbeddedSecret } from "../scripts/source-library.mjs";

/** Fail closed on credentials before persistence or provider calls. No values are logged. */
export function assertTutorContentSafe(content: string) {
  const secretValues = Object.entries(process.env)
    .filter(([name, value]) => !name.startsWith("NEXT_PUBLIC_") && /(?:KEY|TOKEN|SECRET|PASSWORD|PASS$|PIN$|DATABASE_URL)/i.test(name) && value && value.length >= 8)
    .map(([, value]) => value!);
  if (secretValues.some(value => content.includes(value)) || containsEmbeddedSecret(content) ||
    /(?:^|\n)\s*[A-Z_]*(?:SECRET|PASSWORD|PRIVATE_KEY|ACCESS_TOKEN|API_KEY)\s*=\s*(?!["']?(?:YOUR_|EXAMPLE|<|process\.env))["']?[^\s"']{8,}/m.test(content) ||
    /\b(?:sk-[A-Za-z0-9_-]{16,}|sb_secret_[A-Za-z0-9_-]{12,}|Bearer\s+(?!YOUR_|EXAMPLE|<)[A-Za-z0-9._-]{12,})/i.test(content) ||
    /(?:postgres(?:ql)?|mysql):\/\/[^\s:]+:[^\s@]+@/i.test(content) ||
    /(?:api[_-]?key|password|passwd|client[_-]?secret|access[_-]?token|authorization|private[_-]?key)\s*["']?\s*[:=]\s*["'][^"'\r\n]{8,}["']/i.test(content)) {
    throw new Error("SENSITIVE_CONTENT");
  }
}
