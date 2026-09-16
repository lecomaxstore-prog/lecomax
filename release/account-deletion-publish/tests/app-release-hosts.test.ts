import assert from "node:assert/strict";
import test from "node:test";
import { trustedApkArtifact } from "../lib/app-release-hosts.ts";

test("official APK artifacts are accepted", () => {
  assert.ok(trustedApkArtifact("https://expo.dev/artifacts/eas/abc_123-def.apk"));
  assert.ok(trustedApkArtifact("https://github.com/lecomaxstore-prog/lecomax-android-releases/releases/download/v1.0.5/lecomax-v1.0.5.apk"));
});

test("download redirects reject untrusted destinations and mismatched versions", () => {
  for (const url of [
    "not a URL",
    "http://expo.dev/artifacts/eas/app.apk",
    "https://expo.dev/redirect?url=https://example.com/app.apk",
    "https://github.com/attacker/lecomax-android-releases/releases/download/v1.0.5/lecomax-v1.0.5.apk",
    "https://github.com/lecomaxstore-prog/lecomax-android-releases/releases/download/v1.0.5/lecomax-v1.0.4.apk",
    "https://github.com.evil.com/lecomaxstore-prog/lecomax-android-releases/releases/download/v1.0.5/lecomax-v1.0.5.apk",
    "https://user:pass@expo.dev/artifacts/eas/app.apk",
    "https://expo.dev:444/artifacts/eas/app.apk",
  ]) assert.equal(trustedApkArtifact(url), null, url);
});
