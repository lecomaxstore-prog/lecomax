import "server-only";

/** Enforce the limit while streaming, including chunked bodies without a length. */
export async function readBytesLimited(req: Request, maxBytes = 1024 * 1024): Promise<Uint8Array<ArrayBuffer>> {
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > maxBytes) throw new Error("REQUEST_BODY_TOO_LARGE");
  const reader = req.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error("REQUEST_BODY_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

export async function readTextLimited(req: Request, maxBytes = 1024 * 1024): Promise<string> {
  return new TextDecoder("utf-8", { fatal: true }).decode(await readBytesLimited(req, maxBytes));
}

export async function readFormDataLimited(req: Request, maxBytes = 21 * 1024 * 1024) {
  const bytes = await readBytesLimited(req, maxBytes);
  return new Response(bytes, { headers: { "Content-Type": req.headers.get("content-type") || "" } }).formData();
}

export async function readJsonLimited(req: Request, maxBytes = 1024 * 1024) {
  return JSON.parse(await readTextLimited(req, maxBytes));
}
