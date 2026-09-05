export const SUPPORT_ATTACHMENT_PREFIX = '[LECOMAX_FILE_V1]';
export const SUPPORT_FILE_LIMIT = 3 * 1024 * 1024;
export type StoredSupportFile = { path: string; name: string; type: string; size: number };
export type SupportFile = StoredSupportFile & { url: string | null };

export function decodeSupportBody(body: string): { text: string; file?: StoredSupportFile } {
  if (!body.startsWith(SUPPORT_ATTACHMENT_PREFIX)) return { text: body };
  try {
    const value = JSON.parse(body.slice(SUPPORT_ATTACHMENT_PREFIX.length));
    if (typeof value.text !== 'string' || typeof value.file?.path !== 'string' ||
        typeof value.file.name !== 'string' || typeof value.file.type !== 'string' ||
        !Number.isFinite(value.file.size)) return { text: body };
    return value;
  } catch { return { text: body }; }
}

export function supportPreview(body: string | null) {
  if (!body) return body;
  const { text, file } = decodeSupportBody(body);
  return file ? `${file.type.startsWith('image/') ? 'Photo' : 'Document'} · ${text || file.name}` : text;
}

export function detectSupportFile(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if ([137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)) return 'image/png';
  const head = new TextDecoder().decode(bytes.slice(0, 12));
  if (head.startsWith('RIFF') && head.slice(8) === 'WEBP') return 'image/webp';
  if (head.startsWith('%PDF-')) return 'application/pdf';
  return null;
}
