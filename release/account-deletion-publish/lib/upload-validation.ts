import "server-only";
import sharp from "sharp";

export async function validMediaBytes(bytes: Buffer, mime: string): Promise<boolean> {
  if (bytes.length < 12) return false;
  if (mime.startsWith("image/")) {
    const formats: Record<string, string[]> = {
      "image/jpeg": ["jpeg"], "image/jpg": ["jpeg"], "image/png": ["png"], "image/webp": ["webp"],
      "image/gif": ["gif"], "image/avif": ["heif"], "image/heic": ["heif"], "image/heif": ["heif"],
    };
    try {
      const metadata = await sharp(bytes, { limitInputPixels: 40_000_000, failOn: "warning" }).metadata();
      const pixels = (metadata.width || 0) * (metadata.height || 0) * (metadata.pages || 1);
      return Boolean(metadata.format && formats[mime]?.includes(metadata.format) && pixels > 0 && pixels <= 40_000_000);
    } catch { return false; }
  }
  const ascii = (start: number, end: number) => bytes.toString("ascii", start, end);
  if (mime === "video/mp4" || mime === "video/quicktime") return ascii(4, 8) === "ftyp";
  if (mime === "video/webm") return bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (mime === "video/ogg") return ascii(0, 4) === "OggS";
  if (mime === "video/x-msvideo") return ascii(0, 4) === "RIFF" && ascii(8, 12) === "AVI ";
  if (mime === "video/mpeg") return bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && [0xba, 0xb3].includes(bytes[3]);
  return false;
}
