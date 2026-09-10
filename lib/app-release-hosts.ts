/** Only official release artifacts may receive redirects from our download route. */
export function trustedApkArtifact(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash) return null;
    if (url.hostname === "expo.dev" && /^\/artifacts\/eas\/[\w-]+\.apk$/.test(url.pathname)) return url;
    if (url.hostname === "github.com" && /^\/lecomaxstore-prog\/lecomax-android-releases\/releases\/download\/v(\d+\.\d+\.\d+)\/lecomax-v\1\.apk$/.test(url.pathname)) return url;
    return null;
  } catch {
    return null;
  }
}
