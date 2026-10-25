# Audited build — 7 October 2026

Artifact: [lecomax-learn-1.0.1-audited.apk](../artifacts/lecomax-learn-1.0.1-audited.apk).

- Android application ID: `com.lecomax.learning`.
- Version: `1.0.1`, version code `2`.
- Architectures: `arm64-v8a` and `x86_64` in the same APK.
- Minimum Android API 24; target/compile API 36.
- Size: 95,483,858 bytes.
- SHA256: `E08E5DFBA4935968EA1EA02BD2C5AB4704F8C61CDBC81A337B187424473D5B8B`.
- `apksigner verify --verbose --print-certs`: passes; APK signature scheme v2.
- Signer certificate SHA256: `69a0f7fa4609c172acd3d683da50144ffe9810bc2d764c607439dc5081fa6a64`.
- Signer matches the previous 1.0.0 ARM64 APK. The Android debug signing identity is not used.
- Manifest inspection confirms unrelated external storage and overlay permissions are absent. Notification, SecureStore and library-contributed permissions remain.

The complete release build succeeded in 8m45s. A final incremental release build after explorer fixes succeeded in 5m57s, 588 tasks, with 36 executed and 552 up to date. The existing isolated `C:\Temp\l7` build directory was used because the repository path contains an apostrophe and spaces. All 970 runtime/config/content/asset files compared byte-for-byte with the workspace; zero differences. Installed direct dependency versions also matched.

Final Expo Doctor: **21/21 passed**. Expo dependency compatibility: **up to date**. A sandboxed retry initially could not reach the registry; rerunning with network access completed successfully.

Mobile TypeScript, mobile lint, changed backend lint, root TypeScript and all 47 selected regression tests passed (19 mobile, 20 website AI/source, 8 security). The production web export and offline DOM smoke test validate application behavior, not native visual appearance.

The scan result for each exact APK is recorded in [apk-secret-audit.json](apk-secret-audit.json). The audit checks decompressed entries, not just ZIP filenames or source files. No secret values are logged by the scanner.

**This is a signed audit build, not a production acceptance sign-off.** Read [the full audit](SENIOR-AUDIT-2026-10-07.md) for remaining teaching/translation work, live AI deployment and native visual/device validation. Existing 1.0.0 emulator screenshots do not validate this 1.0.1 artifact.

## Reproduce

From `lecomax-learning-app`:

```text
node scripts/migrate.cjs
node scripts/compare-lessons.cjs
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npx.cmd expo install --check
npx.cmd expo-doctor
node scripts/audit-secrets.cjs
npx.cmd expo export --platform web --output-dir dist-web
node scripts/runtime-smoke.cjs
```

Native: use the short-path build copy, preserve its existing signing credentials, run `npx.cmd expo prebuild --platform android --no-install`, then `gradlew.bat assembleRelease "-PreactNativeArchitectures=arm64-v8a,x86_64" --offline --no-daemon --max-workers=2`. Set `JAVA_HOME` to the installed JDK and `ANDROID_HOME` to the Android SDK. The signing config plugin is included in the EAS upload; private credentials and local emulator data are not.

For APK inspection, run `scripts/audit-apk.ps1` from PowerShell and verify the final APK with the installed Android build-tools `apksigner` and `aapt2`. Do not replace the existing signing key when creating updates.
