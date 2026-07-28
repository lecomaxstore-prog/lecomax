export type AndroidReleaseMetadata = {
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

export type UpdateDismissal = {
  versionCode: number;
  dismissedAt: number;
};

export const UPDATE_DISMISSAL_MS = 24 * 60 * 60 * 1000;

export function hasNewerBuild(installedBuild: number, latestBuild: number) {
  return Number.isInteger(installedBuild) && Number.isInteger(latestBuild) && latestBuild > installedBuild;
}

export function shouldPresentUpdate(
  installedBuild: number,
  release: AndroidReleaseMetadata,
  dismissal: UpdateDismissal | null,
  now = Date.now(),
) {
  if (!hasNewerBuild(installedBuild, release.versionCode)) return false;
  if (release.required) return true;
  if (!dismissal || dismissal.versionCode !== release.versionCode) return true;
  return now - dismissal.dismissedAt >= UPDATE_DISMISSAL_MS;
}

export function trustedUpdateUrl(value: string, officialApiUrl: string) {
  try {
    const target = new URL(value);
    const official = new URL(officialApiUrl);
    const developmentHost = ["localhost", "127.0.0.1"].includes(official.hostname);
    return target.hostname === official.hostname &&
      (target.protocol === "https:" || (developmentHost && target.protocol === "http:"))
      ? target.toString()
      : null;
  } catch {
    return null;
  }
}
