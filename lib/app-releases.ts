export const APP_RELEASE_BUCKET = "app-releases";
export const MAX_APK_SIZE = 150 * 1024 * 1024;
export const MIN_APK_SIZE = 1024;
export const APK_MIME_TYPES = new Set([
  "application/vnd.android.package-archive",
  "application/octet-stream",
]);

export type AndroidReleaseRow = {
  id: string;
  platform: "android";
  version_name: string;
  version_code: number;
  storage_path: string;
  file_name: string;
  file_size: number;
  sha256: string;
  minimum_android_version: string;
  release_notes: unknown;
  required: boolean;
  published: boolean;
  published_at: string | null;
  created_at: string;
  download_count: number;
};

export type PublicAndroidRelease = {
  platform: "android";
  versionName: string;
  versionCode: number;
  downloadUrl: string;
  fileSize: number;
  sha256: string;
  minimumAndroidVersion: string;
  releaseDate: string;
  required: boolean;
  releaseNotes: string[];
};

const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const ANDROID_VERSION_PATTERN = /^\d{1,2}(?:\.\d{1,2})?$/;

export function isSemanticVersion(value: unknown): value is string {
  return typeof value === "string" && value.length <= 40 && VERSION_PATTERN.test(value);
}

export function compareVersions(left: string, right: string) {
  const leftParts = left.split("-", 1)[0].split(".").map(Number);
  const rightParts = right.split("-", 1)[0].split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return left === right ? 0 : left.includes("-") ? -1 : right.includes("-") ? 1 : left.localeCompare(right);
}

export function normalizeReleaseNotes(value: unknown) {
  if (!Array.isArray(value) || value.length > 20) return null;
  const notes = value.map((note) => typeof note === "string" ? note.trim() : "");
  if (notes.some((note) => !note || note.length > 300)) return null;
  return [...new Set(notes)];
}

export function validateReleaseDraft(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: "Métadonnées de version invalides." } as const;
  }
  const input = value as Record<string, unknown>;
  const versionName = typeof input.versionName === "string" ? input.versionName.trim() : "";
  const versionCode = Number(input.versionCode);
  const minimumAndroidVersion =
    typeof input.minimumAndroidVersion === "string" ? input.minimumAndroidVersion.trim() : "";
  const releaseNotes = normalizeReleaseNotes(input.releaseNotes);
  const fileName = typeof input.fileName === "string" ? input.fileName.trim() : "";
  const fileSize = Number(input.fileSize);
  const mimeType = typeof input.mimeType === "string" ? input.mimeType.trim().toLowerCase() : "";

  if (!isSemanticVersion(versionName)) return { error: "La version doit respecter le format sémantique, par exemple 1.2.0." } as const;
  if (!Number.isInteger(versionCode) || versionCode < 1 || versionCode > 2_100_000_000) {
    return { error: "Le code de version Android doit être un entier positif." } as const;
  }
  if (!ANDROID_VERSION_PATTERN.test(minimumAndroidVersion)) {
    return { error: "La version Android minimale est invalide." } as const;
  }
  if (!releaseNotes) return { error: "Les notes de version sont invalides." } as const;
  if (!/^[^/\\]{1,120}\.apk$/i.test(fileName)) return { error: "Sélectionnez un fichier APK valide." } as const;
  if (!Number.isInteger(fileSize) || fileSize < MIN_APK_SIZE || fileSize > MAX_APK_SIZE) {
    return { error: `Le fichier APK doit peser entre 1 Ko et ${MAX_APK_SIZE / 1024 / 1024} Mo.` } as const;
  }
  if (!APK_MIME_TYPES.has(mimeType)) return { error: "Le type MIME du fichier APK est invalide." } as const;

  return {
    data: {
      versionName,
      versionCode,
      minimumAndroidVersion,
      releaseNotes,
      required: input.required === true,
      fileName,
      fileSize,
      mimeType,
    },
  } as const;
}

export function releaseStoragePath(versionName: string, versionCode: number) {
  if (!isSemanticVersion(versionName) || !Number.isInteger(versionCode) || versionCode < 1) {
    throw new Error("INVALID_RELEASE_PATH");
  }
  return `android/${versionCode}/lecomax-v${versionName}.apk`;
}

export function publicRelease(row: AndroidReleaseRow, origin: string): PublicAndroidRelease {
  const releaseNotes = normalizeReleaseNotes(row.release_notes) ?? [];
  return {
    platform: "android",
    versionName: row.version_name,
    versionCode: row.version_code,
    downloadUrl: `${origin.replace(/\/$/, "")}/downloads/${encodeURIComponent(row.file_name)}`,
    fileSize: Number(row.file_size),
    sha256: row.sha256,
    minimumAndroidVersion: row.minimum_android_version,
    releaseDate: row.published_at ?? row.created_at,
    required: row.required,
    releaseNotes,
  };
}

export function isApkHeader(bytes: Uint8Array) {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b &&
    ((bytes[2] === 0x03 && bytes[3] === 0x04) || (bytes[2] === 0x05 && bytes[3] === 0x06));
}

export function selectLatestPublished(rows: AndroidReleaseRow[]) {
  return rows
    .filter((row) => row.platform === "android")
    .filter((row) => row.published)
    .sort((left, right) => right.version_code - left.version_code)[0] ?? null;
}
