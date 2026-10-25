# Android validation — 7 October 2026

The resumed native smoke test passed on an isolated Android API 36 x86_64
emulator (`Learn_QA`, serial `emulator-5584`). This is a manual ADB-driven UI
smoke test with screenshots and accessibility dumps, not full instrumentation.

## Build and artifacts

- Phone APK: `artifacts/lecomax-learn-1.0.0-arm64.apk`, unchanged.
  SHA256: `210079338E4979783E1D8AB187F2CB8C5A287B779128971B61FBEEAFDC5C86DB`.
- Emulator APK: `artifacts/lecomax-learn-1.0.0-x86_64-test.apk`.
  SHA256: `9FA46102EC0A291EDF783D855A4F66CFAFF07A4F85C2AA3AEFF65F96B0F59E6C`.
- Both use the dedicated learning-app signing identity. The new APK passed
  apksigner verification for v2 and v3 signatures.
- All 951 app/content files, plus package.json, package-lock.json and app.json,
  matched the existing short-path build copy in `C:\Temp\l7`.
- `gradlew.bat assembleRelease -PreactNativeArchitectures=x86_64 --offline
  --no-daemon --max-workers=2` succeeded, including release lint checks.
- The existing automated suite was rerun: 14 tests passed, zero failures.

## Native checks passed

1. Fresh installation and cold launch of the signed x86_64 release APK.
2. Arabic home screen and right-to-left lesson content rendered.
3. Continue opened the first lesson, `start-web`.
4. Bookmark toggled; a note was entered through the native text field.
5. Quiz answer showed correct feedback; completing the lesson updated progress.
6. Force-stop and cold restart changed the app PID from 7136 to 7680.
   Home restored one completed lesson, 1,362 remaining and a 100% quiz score.
7. Reopening `start-web` restored its bookmark, correct answer, completed state,
   lesson stage and the exact note `Native-QA-note-20261007`.
8. Switching to English and dark mode persisted through another cold restart.
9. With Wi-Fi and mobile data disabled on the isolated emulator, the app started,
   displayed its offline status and opened the next lesson. Connectivity was
   restored after the test.
10. Captured runtime logs contained no fatal Android exception, ReactNativeJS
    error or missing-library exception during the x86_64 smoke test.

## Evidence

- [Arabic home after restart](android-validation/android-home.png)
- [Restored note and completed lesson](android-validation/android-restored-note.png)
- [Offline English home in dark mode](android-validation/android-offline-restart.png)
- Accessibility XML dumps are beside the screenshots in `android-validation/`.
- Build log: `../android-emulator-build.log` (local, ignored by Git).

## Environment issues resolved and scope limits

The existing emulator was nearly full. A temporary storage-reserve adjustment
allowed installation; the setting was immediately restored and the failed test
installation was removed afterward. Existing user apps were retained.

The ARM64-only APK failed on that x86_64 emulator: SoLoader searched for
`lib/x86_64/libreactnative.so`. A separately compiled x86_64 APK resolved the
emulator launch failure. This validates the app source on native Android, but
does **not** prove that the ARM64 phone APK launches on physical ARM64 hardware.

A clean, isolated AVD was created under ignored `.android-qa/`. Its initial ADB
identity mismatch was resolved by reinitializing only this disposable AVD under
the Windows user account. No authentication bypass flags were used.

Physical-device notification delivery, physical ARM64 launch, and live owner
AI sign-in/model responses remain unverified. The mobile AI routes still need
deployment as described in README.md; no website deployment was performed here.
