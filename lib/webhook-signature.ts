import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyWhatsAppSignature(body: string, signature: string | null, secret: string | undefined) {
  if (!secret || !signature || !/^sha256=[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(body, "utf8").digest();
  return timingSafeEqual(expected, Buffer.from(signature.slice(7), "hex"));
}
