import { msg } from "@/i18n";
export async function withSessionTimeout<T>(operation: Promise<T>, timeoutMs = 12_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(msg("useSupportAccount.unableToVerifyYourSessionTryAgain"))), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
