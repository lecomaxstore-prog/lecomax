import assert from "node:assert/strict";
import test from "node:test";
import {
  isApkHeader,
  publicRelease,
  releaseStoragePath,
  selectLatestPublished,
  validateReleaseDraft,
  type AndroidReleaseRow,
} from "../lib/app-releases.ts";
import {
  hasNewerBuild,
  shouldPresentUpdate,
  trustedUpdateUrl,
} from "../mobile/src/lib/app-update.ts";

const draft = {
  versionName: "1.2.0",
  versionCode: 12,
  minimumAndroidVersion: "8.0",
  releaseNotes: ["Checkout plus stable"],
  required: false,
  fileName: "lecomax-v1.2.0.apk",
  fileSize: 50_000_000,
  mimeType: "application/vnd.android.package-archive",
};

function row(overrides: Partial<AndroidReleaseRow> = {}): AndroidReleaseRow {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    platform: "android",
    version_name: "1.2.0",
    version_code: 12,
    storage_path: "android/12/lecomax-v1.2.0.apk",
    file_name: "lecomax-v1.2.0.apk",
    file_size: 50_000_000,
    sha256: "a".repeat(64),
    minimum_android_version: "8.0",
    release_notes: ["Checkout plus stable"],
    required: false,
    published: true,
    published_at: "2026-07-26T12:00:00.000Z",
    created_at: "2026-07-26T11:00:00.000Z",
    download_count: 0,
    ...overrides,
  };
}

test("release draft validation accepts a production APK", () => {
  const result = validateReleaseDraft(draft);
  assert.ok("data" in result);
  assert.equal(result.data?.versionCode, 12);
  assert.equal(releaseStoragePath("1.2.0", 12), "android/12/lecomax-v1.2.0.apk");
});

test("release upload validation rejects path traversal, invalid MIME and oversized files", () => {
  assert.ok("error" in validateReleaseDraft({ ...draft, fileName: "../../attack.apk" }));
  assert.ok("error" in validateReleaseDraft({ ...draft, mimeType: "application/x-msdownload" }));
  assert.ok("error" in validateReleaseDraft({ ...draft, fileSize: 151 * 1024 * 1024 }));
});

test("APK signature validation rejects malformed executable uploads", () => {
  assert.equal(isApkHeader(Uint8Array.from([0x50, 0x4b, 0x03, 0x04])), true);
  assert.equal(isApkHeader(Uint8Array.from([0x4d, 0x5a, 0x90, 0x00])), false);
});

test("latest release selection ignores unpublished releases", () => {
  assert.equal(selectLatestPublished([
    row({ version_code: 10 }),
    row({ version_code: 13, published: false }),
    row({ version_code: 12 }),
  ])?.version_code, 12);
});

test("public release metadata contains only the clean official download URL", () => {
  const value = publicRelease(row(), "https://lecomax.com");
  assert.equal(value.downloadUrl, "https://lecomax.com/downloads/lecomax-v1.2.0.apk");
  assert.equal("storage_path" in value, false);
  assert.equal(value.sha256.length, 64);
});

test("required and optional mobile update behavior is deterministic", () => {
  const release = publicRelease(row(), "https://lecomax.com");
  assert.equal(hasNewerBuild(11, 12), true);
  assert.equal(shouldPresentUpdate(11, release, null), true);
  assert.equal(shouldPresentUpdate(11, release, { versionCode: 12, dismissedAt: Date.now() }), false);
  assert.equal(shouldPresentUpdate(11, { ...release, required: true }, { versionCode: 12, dismissedAt: Date.now() }), true);
  assert.equal(shouldPresentUpdate(12, { ...release, required: true }, null), false);
});

test("mobile updater accepts only the official HTTPS host", () => {
  assert.equal(trustedUpdateUrl("https://lecomax.com/downloads/lecomax-v1.2.0.apk", "https://lecomax.com"), "https://lecomax.com/downloads/lecomax-v1.2.0.apk");
  assert.equal(trustedUpdateUrl("https://evil.example/lecomax.apk", "https://lecomax.com"), null);
  assert.equal(trustedUpdateUrl("http://lecomax.com/lecomax.apk", "https://lecomax.com"), null);
});
